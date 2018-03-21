#include <node_api.h>
#include <assert.h>
#include <stdio.h>
#include "js-passthrough.h"
#include "utils-inl.h"

napi_ref PassThrough::constructor;

PassThrough::PassThrough()
    : js_source_(nullptr),
      js_sink_(nullptr),
      env_(nullptr),
      wrapper_(nullptr),
      buf_ref_(nullptr),
      source_(nullptr),
      sink_(nullptr) {}

PassThrough::~PassThrough() {
  napi_delete_reference(env_, wrapper_);
  if (js_source_ != nullptr) napi_delete_reference(env_, js_source_);
  if (js_sink_ != nullptr) napi_delete_reference(env_, js_sink_);
}

// Called by N-API.
void PassThrough::Destructor(napi_env env, void* nativeObject, void* /*finalize_hint*/) {
  printf("### cleaned up\n");
  delete static_cast<PassThrough*>(nativeObject);
}

//
//  C++ only binding
//

Bob_Base* PassThrough::BindSource(Bob_Base* source) {
  if (js_source_ != nullptr) {
    printf("Should not bind from C++ when there is js_source_\n");
    return this;
  }

  source->BindSink(static_cast<Bob_Base*>(this));
  source_ = source;

  return this;
}

void PassThrough::BindSink(Bob_Base* sink) {
  if (js_sink_ != nullptr) {
    printf("Should not bind from C++ when there is js_sink_\n");
    return;
  }

  sink_ = sink;
}

//
// C++ API
//

void PassThrough::Next(int bob_status, void** error, char* data, size_t bytes) {
  // If we have bound to the C++ API
  if (sink_ != nullptr) {
    sink_->Next(bob_status, error, data, bytes);

  // If we have bound to the JS API
  } else if (js_sink_ != nullptr) {
    napi_status status;

    napi_value sink;
    status = napi_get_reference_value(env_, js_sink_, &sink);
    assert(status == napi_ok);

    napi_value sink_next;
    status = napi_get_named_property(env_, sink, "next", &sink_next);
    assert(status == napi_ok);

    napi_value buffer;
    status = napi_create_buffer_copy(env_, bytes, data, nullptr, &buffer);
    assert(status == napi_ok);

    // If we had data from a JS buffer previously (probably) we need to free it.
    if (buf_ref_ != nullptr) {
      status = napi_delete_reference(env_, buf_ref_);
      assert(status == napi_ok);
      buf_ref_ = nullptr;
    }

    napi_value js_status;
    status = napi_create_int32(env_, bob_status, &js_status);
    assert(status == napi_ok);

    napi_value js_bytes;
    status = napi_create_int32(env_, bytes, &js_bytes);
    assert(status == napi_ok);

    size_t argc = 4;
    const napi_value argv[] = {
      js_status,
      reinterpret_cast<napi_value>(*error),
      buffer,
      js_bytes
    };

    status = napi_make_callback(env_,
                                nullptr,
                                sink,
                                sink_next,
                                argc,
                                argv,
                                nullptr);
    assert(status == napi_ok);

  } else {
    printf("PassThrough::Next called with invalid {js_}sink_ pointers\n");
  }
}

void PassThrough::Pull(void** error, char* data, size_t size) {
  // If we have bound to the C++ API
  if (source_ != nullptr) {
    source_->Pull(error, data, size);

  // If we have bound to the JS API
  } else if (js_source_ != nullptr) {
    napi_status status;

    napi_value source;
    status = napi_get_reference_value(env_, js_source_, &source);
    assert(status == napi_ok);

    napi_value source_pull;
    status = napi_get_named_property(env_, source, "pull", &source_pull);
    assert(status == napi_ok);

    napi_value buffer;
    status = napi_create_buffer_copy(env_, size, data, nullptr, &buffer);
    assert(status == napi_ok);

    // If we had data from a JS buffer previously (probably) we need to free it.
    if (buf_ref_ != nullptr) {
      status = napi_delete_reference(env_, buf_ref_);
      assert(status == napi_ok);
      buf_ref_ = nullptr;
    }

    size_t argc = 2;
    const napi_value argv[] = {
      reinterpret_cast<napi_value>(*error),
      buffer
    };

    status = napi_make_callback(env_,
                                nullptr,
                                source,
                                source_pull,
                                argc,
                                argv,
                                nullptr);
    assert(status == napi_ok);

  } else {
    printf("PassThrough::Pull called with invalid {js_}sink_ pointers\n");
  }
}

//
// JavaScript API
//

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

  napi_value js_bindsink;
  status = napi_get_named_property(env, source, "bindSink", &js_bindsink);
  assert(status == napi_ok);

  napi_value argv_[1] = { jsthis };
  status = napi_call_function(env,
                              source,
                              js_bindsink,
                              1,
                              argv_,
                              nullptr);
  assert(status == napi_ok);

  PassThrough* obj;
  status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
  assert(status == napi_ok);

  // Bind to the C++ API if it is available.
  Bob_Base* source_obj;
  status = napi_unwrap(env, source, reinterpret_cast<void**>(&source_obj));
  if (source_obj != nullptr && status == napi_ok) {
    printf("bound c++ source!\n");
    obj->source_ = source_obj;
  }

  // Set a JS property to hold the reference from being GC'd but in JS so it is
  // still visible to the GC, then keep the C++ reference weakly.
  status = napi_set_named_property(env, jsthis, "source", source);
  assert(status == napi_ok);

  napi_ref js_source_ref;
  status = napi_create_reference(env, source, 0, &js_source_ref);
  assert(status == napi_ok);

  obj->js_source_ = js_source_ref;

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

  // Bind to the C++ API if it is available.
  Bob_Base* sink_obj;
  status = napi_unwrap(env, argv[0], reinterpret_cast<void**>(&sink_obj));
  if (sink_obj != nullptr && status == napi_ok) {
    printf("bound c++ sink!\n");
    obj->sink_ = sink_obj;
  }

  napi_value sink = argv[0];

  // Set a JS property to hold the reference from being GC'd but in JS so it is
  // still visible to the GC, then keep the C++ reference weakly.
  status = napi_set_named_property(env, jsthis, "sink", sink);
  assert(status == napi_ok);

  napi_ref sink_ref;
  status = napi_create_reference(env, sink, 0, &sink_ref);
  assert(status == napi_ok);

  obj->js_sink_ = sink_ref;

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

  // If we have bound to the C++ API
  if (obj->sink_ != nullptr) {
    int bob_status;
    status = napi_get_value_int32(env, argv[0], &bob_status);
    assert(status == napi_ok);

    status = napi_create_reference(env, argv[2], 1, &obj->buf_ref_);
    assert(status == napi_ok);

    char* data = nullptr;
    size_t buffsize;
    status = napi_get_buffer_info(env,
                                  argv[2],
                                  reinterpret_cast<void**>(&data),
                                  &buffsize);
    assert(status == napi_ok);

    int bytes;
    status = napi_get_value_int32(env, argv[3], &bytes);
    assert(status == napi_ok);

    printf("C++ -> C++ next!\n");

    obj->sink_->Next(bob_status, reinterpret_cast<void**>(&argv[1]), data, bytes);

  // If we have bound to the JS API
  } else if (obj->js_sink_ != nullptr) {
    napi_value sink;

    status = napi_get_reference_value(env, obj->js_sink_, &sink);
    assert(status == napi_ok);

    napi_value sink_next;
    status = napi_get_named_property(env, sink, "next", &sink_next);
    assert(status == napi_ok);

    status = napi_make_callback(env,
                                nullptr,
                                sink,
                                sink_next,
                                4,
                                argv,
                                nullptr);
    assert(status == napi_ok);

  } else {
    printf("PassThrough::Next (JS) called with invalid {js_}sink_ pointers\n");
  }
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

  // If we have bound to the C++ API
  if (obj->source_ != nullptr) {
    status = napi_create_reference(env, argv[1], 1, &obj->buf_ref_);
    assert(status == napi_ok);

    char* data = nullptr;
    size_t size;
    status = napi_get_buffer_info(env,
                                  argv[1],
                                  reinterpret_cast<void**>(&data),
                                  &size);
    assert(status == napi_ok);

    printf("C++ -> C++ pull!\n");

    obj->source_->Pull(reinterpret_cast<void**>(&argv[0]), data, size);

  // If we have bound to the JS API
  } else if (obj->js_source_ != nullptr) {
    napi_value source;

    status = napi_get_reference_value(env, obj->js_source_, &source);
    assert(status == napi_ok);

    napi_value js_pull;
    status = napi_get_named_property(env, source, "pull", &js_pull);
    assert(status == napi_ok);

    status = napi_make_callback(env,
                                nullptr,
                                source,
                                js_pull,
                                2,
                                argv,
                                nullptr);
    assert(status == napi_ok);

  } else {
    printf("PassThrough::Pull (JS) called with invalid {js_}sink_ pointers\n");
  }
  return nullptr;
}
