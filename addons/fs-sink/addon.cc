#include <assert.h>
#include <node_api.h>
#include <iostream>
#include "fs-sink.h"
#include "../bob.h"

napi_value SetupBind(napi_env env, napi_callback_info cb_info) {
  napi_status status;

  size_t argc = 2;
  napi_value argv[2];

  status = napi_get_cb_info(env, cb_info, &argc, argv, nullptr, nullptr);
  assert(status == napi_ok);

  // Bind to the C++ API
  Bob_Base* source;
  status = napi_unwrap(env, argv[0], reinterpret_cast<void**>(&source));
  if (source != nullptr && status == napi_ok) {
    uv_loop_t* loop;
    status = napi_get_uv_event_loop(env, &loop);
    assert(status == napi_ok);

    size_t string_size = 0;
    status = napi_get_value_string_utf8(env,
                                        argv[1],
                                        nullptr,
                                        0,
                                        &string_size);
    assert(status == napi_ok);

    char* buf = new char[string_size + 1];
    status = napi_get_value_string_utf8(env,
                                        argv[1],
                                        buf,
                                        string_size + 1,
                                        nullptr);
    assert(status == napi_ok);

    std::cout << "Path: '" << buf << "'\n";

    FS_Sink* sink = new FS_Sink(loop,
                                buf,
                                O_WRONLY | O_CREAT,
                                0x1B6,
                                16 * 1024);

    printf("bound c++ sink!\n");
    sink->BindSource(source);

    sink->Start();
  } else {
    printf("unable to bind c++ sink in binder\n");
    abort();
  }

  return nullptr;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_status status;

  status = napi_create_function(env,
                                "setup",
                                5,
                                SetupBind,
                                nullptr,
                                &exports);
  assert(status == napi_ok);

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
