#ifndef FS_SOURCE_H_
#define FS_SOURCE_H_

#include <uv.h>
#include "../bob.h"

class FS_Source : public Bob_Base {
 public:
  FS_Source(uv_loop_t* loop, const char* path, int flags, int mode);
  virtual ~FS_Source();

  virtual Bob_Base* BindSource(Bob_Base* source);
  virtual void BindSink(Bob_Base* sink);
  virtual void Next(int status, void** error, char* data, size_t bytes);
  virtual void Pull(void** error, char* data, size_t size);

 private:
  Bob_Base* sink_;

  uv_loop_t* loop_;
  const char* path_;
  int flags_;
  int mode_;
  uv_fs_t req_;
  uv_file fd_;
  int64_t pos_;

  char* tmpdata_;
};

#endif  // FS_SOURCE_H_
