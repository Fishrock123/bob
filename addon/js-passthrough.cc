#include <node_api.h>
#include <assert.h>
#include <stdio.h>
#include "js-passthrough.h"
#include "utils-inl.h"

napi_ref PassThrough::constructor;

PassThrough::PassThrough()
    : source_(nullptr), sink_(nullptr), env_(nullptr), wrapper_(nullptr) {}

PassThrough::~PassThrough() { napi_delete_reference(env_, wrapper_); }

void PassThrough::Destructor(napi_env env, void* nativeObject, void* /*finalize_hint*/) {
  reinterpret_cast<PassThrough*>(nativeObject)->~PassThrough();
}

#define DECLARE_NAPI_METHOD(name, func)                          \
  { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value PassThrough::CreateClass(napi_env env) {
  napi_status status;
  napi_property_descriptor properties[] = {
      // { "value", 0, 0, GetValue, SetValue, 0, napi_default, 0 },
      DECLARE_NAPI_METHOD("bindSource", BindSource),
      DECLARE_NAPI_METHOD("bindSink", BindSink),
      DECLARE_NAPI_METHOD("next", Next),
      DECLARE_NAPI_METHOD("pull", Pull),
  };

  napi_value cons;
  status =
      napi_define_class(env, "PassThrough", NAPI_AUTO_LENGTH, New, nullptr, 4, properties, &cons);
  if (status != napi_ok) return nullptr;

  status = napi_create_reference(env, cons, 1, &constructor);
  if (status != napi_ok) return nullptr;

  assert(status == napi_ok);
  return cons;
}

napi_value PassThrough::New(napi_env env, napi_callback_info info) {
  napi_status status;

  napi_value target;
  status = napi_get_new_target(env, info, &target);
  assert(status == napi_ok);
  bool is_constructor = target != nullptr;

  if (is_constructor) {
    // Invoked as constructor: `new PassThrough(...)`
    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);
    //
    // double value = 0;
    //
    // napi_valuetype valuetype;
    // status = napi_typeof(env, args[0], &valuetype);
    // assert(status == napi_ok);
    //
    // if (valuetype != napi_undefined) {
    //   status = napi_get_value_double(env, args[0], &value);
    //   assert(status == napi_ok);
    // }

    PassThrough* obj = new PassThrough();

    obj->env_ = env;
    status = napi_wrap(env,
                       jsthis,
                       reinterpret_cast<void*>(obj),
                       PassThrough::Destructor,
                       nullptr,  // finalize_hint
                       &obj->wrapper_);
    assert(status == napi_ok);

    return jsthis;
  } else {
    // Invoked as plain function `PassThrough(...)`, turn into construct call.
    size_t argc_ = 1;
    napi_value args[1];
    status = napi_get_cb_info(env, info, &argc_, args, nullptr, nullptr);
    assert(status == napi_ok);

    const size_t argc = 1;
    napi_value argv[argc] = {args[0]};

    napi_value cons;
    status = napi_get_reference_value(env, constructor, &cons);
    assert(status == napi_ok);

    napi_value instance;
    status = napi_new_instance(env, cons, argc, argv, &instance);
    assert(status == napi_ok);

    return instance;
  }
}

napi_value PassThrough::BindSource(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 1;
  napi_value argv[argc];
  napi_value jsthis;
  status = napi_get_cb_info(env, info, &argc, argv, &jsthis, nullptr);
  assert(status == napi_ok);

  napi_value source = argv[0];

  napi_value global;
  status = napi_get_global(env, &global);
  assert(status == napi_ok);
  PRINT_NAPI_TYPE(global, "0");

  napi_value console;
  status = napi_get_named_property(env,
                                   global,
                                   "console",
                                   &console);
  assert(status == napi_ok);
  PRINT_NAPI_TYPE(console, "1");

  napi_value log_;
  status = napi_get_named_property(env,
                                   console,
                                   "log",
                                   &log_);
  assert(status == napi_ok);
  PRINT_NAPI_TYPE(log_, "2");

  napi_value console_args[1] = { source };
  status = napi_call_function(env,
                              console,
                              log_,
                              1,
                              console_args,
                              nullptr);
  assert(status == napi_ok);


  napi_value source_bindsink;
  status = napi_get_named_property(env,
                                   source,
                                   "bindSink",
                                   &source_bindsink);
  assert(status == napi_ok);
  PRINT_NAPI_TYPE(source_bindsink, "4");

  napi_value argv_[1] = { jsthis };
  status = napi_call_function(env,
                              source,
                              source_bindsink,
                              1,
                              argv_,
                              nullptr);
  PRINT_NAPI_ERROR_MESSAGE(status, "source.bindSink()");
  assert(status == napi_ok);

  PassThrough* obj;
  status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
  assert(status == napi_ok);

  napi_ref source_ref;
  status = napi_create_reference(env, source, 1, &source_ref);
  assert(status == napi_ok);

  obj->source_ = source_ref;

  return jsthis;
}

napi_value PassThrough::BindSink(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 1;
  napi_value argv[argc];
  napi_value jsthis;
  status = napi_get_cb_info(env, info, &argc, argv, &jsthis, nullptr);
  assert(status == napi_ok);

  PassThrough* obj;
  status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
  assert(status == napi_ok);

  napi_ref sink_ref;
  status = napi_create_reference(env, argv[0], 1, &sink_ref);
  assert(status == napi_ok);

  obj->sink_ = sink_ref;

  return nullptr;
}

napi_value PassThrough::Next(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 4;
  napi_value argv[argc];
  napi_value jsthis;
  status = napi_get_cb_info(env, info, &argc, argv, &jsthis, nullptr);
  assert(status == napi_ok);

  PassThrough* obj;
  status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
  assert(status == napi_ok);

  napi_value sink;
  status = napi_get_reference_value(env, obj->sink_, &sink);
  assert(status == napi_ok);

  napi_value sink_next;
  status = napi_get_named_property(env,
                                   sink,
                                   "next",
                                   &sink_next);
  assert(status == napi_ok);

  status = napi_call_function(env,
                              sink,
                              sink_next,
                              4,
                              argv,
                              nullptr);
  assert(status == napi_ok);

  return nullptr;
}

napi_value PassThrough::Pull(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 2;
  napi_value argv[argc];
  napi_value jsthis;
  status = napi_get_cb_info(env, info, &argc, argv, &jsthis, nullptr);
  assert(status == napi_ok);

  PassThrough* obj;
  status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
  assert(status == napi_ok);

  napi_value source;
  status = napi_get_reference_value(env, obj->source_, &source);
  assert(status == napi_ok);

  PRINT_NAPI_TYPE(source, "5");

  napi_value source_pull;
  status = napi_get_named_property(env,
                                   source,
                                   "pull",
                                   &source_pull);
  assert(status == napi_ok);

  PRINT_NAPI_TYPE(source_pull, "5");

  status = napi_call_function(env,
                              source,
                              source_pull,
                              2,
                              argv,
                              nullptr);
  PRINT_NAPI_ERROR_MESSAGE(status, "10");
  PRINT_NAPI_STATUS(status, "20");
  // assert(status == napi_ok);

  return nullptr;
}
