#include <uv.h>
#include <assert.h>
#include <stdio.h>
#include "fs-source.h"
#include "../utils-inl.h"

FS_Source::FS_Source(uv_loop_t* loop, const char* path, int flags, int mode)
    : sink_(nullptr),
      loop_(loop),
      path_(path),
      flags_(flags),
      mode_(mode),
      req_(),
      fd_(-1),
      pos_(0),
      tmpdata_(nullptr) {}

FS_Source::~FS_Source() {
  delete[] path_;
}

//
//  C++ only binding
//

Bob_Base* FS_Source::BindSource(Bob_Base* source) {
  printf("this is the source!");
  abort();
}

void FS_Source::BindSink(Bob_Base* sink) {
  sink_ = sink;
}

//
// C++ API
//

void FS_Source::Next(int bob_status, void** error, char* data, size_t bytes) {
  printf("Sources do not have a public ::Next!");
  abort();
}

void FS_Source::Pull(void** error, char* data, size_t size) {
  if (loop_ == nullptr) {
    printf("FS_Source::Pull loop null");
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

  uv_buf_t buf = uv_buf_init(const_cast<char*>(data), size);

  this->tmpdata_ = data;
  req_.data = this;

  uv_fs_read(loop_, &req_, fd_, &buf, 1, pos_, [](uv_fs_t* req) -> void {
    if (req->result < 0) {
      printf("Libuv error uv_fs_read!! %zi\n", req->result);
      const char* errname = uv_err_name(req->result);
      printf("Name: %s\n", errname);
      const char* errmsg = uv_strerror(req->result);
      printf("Message: %s\n", errmsg);
      abort();
    }
    FS_Source* self = static_cast<FS_Source*>(req->data);

    int result = req->result;
    self->pos_ += result;
    int ret_status = result > 0 ? Status::CONTINUE : Status::END;

    char* data = self->tmpdata_;
    self->tmpdata_ = nullptr;

    uv_fs_req_cleanup(req);

    if (ret_status == Status::END) {
      self->req_.data = self;
      uv_fs_close(self->loop_, &self->req_, self->fd_, [](uv_fs_t* req) -> void {
        FS_Source* self = static_cast<FS_Source*>(req->data);
        self->fd_ = -1;
      });
      uv_fs_req_cleanup(req);
    }

    void* error_data = nullptr;
    self->sink_->Next(ret_status, &error_data, data, result);
  });
}
