#ifndef JS_PASSTHROUGH_H_
#define JS_PASSTHROUGH_H_

#include <node_api.h>

class PassThrough {
 public:
  PassThrough();
  ~PassThrough();

  static napi_value CreateClass(napi_env env);

  static void Destructor(napi_env env, void* nativeObject, void* finalize_hint);

 private:
  static napi_value New(napi_env env, napi_callback_info info);
  static napi_value BindSource(napi_env env, napi_callback_info info);
  static napi_value BindSink(napi_env env, napi_callback_info info);
  static napi_value Next(napi_env env, napi_callback_info info);
  static napi_value Pull(napi_env env, napi_callback_info info);

  static napi_ref constructor;
  napi_ref source_;
  napi_ref sink_;
  napi_env env_;
  napi_ref wrapper_;
};

#endif  // JS_PASSTHROUGH_H_
