#include <node_api.h>
#include "js-passthrough.h"

napi_value Init(napi_env env, napi_value exports) {
  exports = PassThrough::CreateClass(env);

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
