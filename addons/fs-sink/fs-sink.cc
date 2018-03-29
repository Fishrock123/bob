#include <uv.h>
#include <assert.h>
#include <stdio.h>
#include "fs-sink.h"
#include "../utils-inl.h"

FS_Sink::FS_Sink(uv_loop_t* loop, const char* path, int flags, int mode, uint32_t bufsize)
    : source_(nullptr),
      loop_(loop),
      path_(path),
      flags_(flags),
      mode_(mode),
      req_(),
      fd_(-1),
      pos_(0) {
  buf_ = uv_buf_init(new char[bufsize], bufsize);
}

FS_Sink::~FS_Sink() {
  delete[] path_;
  delete[] buf_.base;
}

//
//  C++ only binding
//

Bob_Base* FS_Sink::BindSource(Bob_Base* source) {
  source->BindSink(static_cast<Bob_Base*>(this));
  source_ = source;

  return this;
}

void FS_Sink::BindSink(Bob_Base* sink) {
  printf("this is the sink!");
  abort();
}

//
// C++ API
//

void FS_Sink::Next(int bob_status, void** error, char* data, size_t bytes) {
  if (loop_ == nullptr) {
    printf("FS_Sink::Pull loop null");
    abort();
  }
  if (fd_ == -1) {
    fd_ = uv_fs_open(loop_, &req_, path_, flags_, mode_, nullptr);
    if (req_.result < 0) {
      printf("Libuv error uv_fs_open!! %zi\n", req_.result);
      const char* errname = uv_err_name(req_.result);
      printf("Name: %s\n", errname);
      const char* errmsg = uv_strerror(req_.result);
      printf("Message: %s\n", errmsg);
      abort();
    }
    uv_fs_req_cleanup(&req_);
  }

  uv_buf_t buf = uv_buf_init(const_cast<char*>(data), bytes);

  req_.data = this;

  uv_fs_write(loop_, &req_, fd_, &buf, 1, pos_, [](uv_fs_t* req) -> void {
    if (req->result < 0) {
      printf("Libuv error uv_fs_read!! %zi\n", req->result);
      const char* errname = uv_err_name(req->result);
      printf("Name: %s\n", errname);
      const char* errmsg = uv_strerror(req->result);
      printf("Message: %s\n", errmsg);
      abort();
    }
    FS_Sink* self = static_cast<FS_Sink*>(req->data);

    int result = req->result;
    self->pos_ += result;
    int ret_status = result > 0 ? Status::CONTINUE : Status::END;

    uv_fs_req_cleanup(req);

    if (ret_status == Status::END) {
      self->req_.data = self;
      uv_fs_close(self->loop_, &self->req_, self->fd_, [](uv_fs_t* req) -> void {
        FS_Sink* self = static_cast<FS_Sink*>(req->data);
        self->fd_ = -1;
        uv_fs_req_cleanup(req);
      });
      return;
    }

    void* error_data = nullptr;
    self->source_->Pull(&error_data, self->buf_.base, self->buf_.len);
  });
}

void FS_Sink::Pull(void** error, char* data, size_t size) {
  printf("Sinks do not have a public ::Pull!");
  abort();
}

void FS_Sink::Start() {
  void* error_data = nullptr;
  source_->Pull(&error_data, buf_.base, buf_.len);
}
