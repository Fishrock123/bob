#ifndef FS_SOURCE_H_
#define FS_SOURCE_H_

#include <uv.h>
#include "../bob.h"

class FS_Sink : public Bob_Base {
 public:
  FS_Sink(uv_loop_t* loop, const char* path, int flags, int mode, uint32_t bufsize);
  virtual ~FS_Sink();

  virtual Bob_Base* BindSource(Bob_Base* source);
  virtual void BindSink(Bob_Base* sink);
  virtual void Next(int status, void** error, char* data, size_t bytes);
  virtual void Pull(void** error, char* data, size_t size);
  void Start();

 private:
  Bob_Base* source_;

  uv_loop_t* loop_;
  const char* path_;
  int flags_;
  int mode_;
  uv_fs_t req_;
  uv_file fd_;
  int64_t pos_;

  uv_buf_t buf_;
};

#endif  // FS_SOURCE_H_
