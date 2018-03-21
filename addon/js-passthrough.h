#ifndef JS_PASSTHROUGH_H_
#define JS_PASSTHROUGH_H_

#include <node_api.h>
#include "bob.h"

class PassThrough : Bob_Base {
 public:
  PassThrough();
  virtual ~PassThrough();

  virtual Bob_Base* BindSource(Bob_Base* source);
  virtual void BindSink(Bob_Base* sink);
  virtual void Next(int status, void** error, char* data, size_t bytes);
  virtual void Pull(void** error, char* data, size_t size);

  static napi_value CreateClass(napi_env env);

  static void Destructor(napi_env env, void* nativeObject, void* finalize_hint);

 private:
  static napi_value New(napi_env env, napi_callback_info info);
  static napi_value BindSource(napi_env env, napi_callback_info info);
  static napi_value BindSink(napi_env env, napi_callback_info info);
  static napi_value Next(napi_env env, napi_callback_info info);
  static napi_value Pull(napi_env env, napi_callback_info info);

  static napi_ref constructor;
  napi_ref js_source_;
  napi_ref js_sink_;
  napi_env env_;
  napi_ref wrapper_;

  napi_ref buf_ref_;

  Bob_Base* source_;
  Bob_Base* sink_;
};

#endif  // JS_PASSTHROUGH_H_
