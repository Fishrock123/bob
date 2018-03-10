#include <node_api.h>

#define PRINT_NAPI_TYPE(value, str)                                            \
  {                                                                            \
    napi_valuetype type;                                                       \
    napi_status status = napi_typeof(env, value, &type);                       \
    assert(status == napi_ok);                                                 \
                                                                               \
    if (type == napi_undefined) printf("%s - undefined\n", str);               \
    if (type == napi_null) printf("%s - null\n", str);                         \
    if (type == napi_boolean) printf("%s - boolean\n", str);                   \
    if (type == napi_number) printf("%s - number\n", str);                     \
    if (type == napi_string) printf("%s - string\n", str);                     \
    if (type == napi_symbol) printf("%s - symbol\n", str);                     \
    if (type == napi_object) printf("%s - Object\n", str);                     \
    if (type == napi_function) printf("%s - Function\n", str);                 \
    if (type == napi_external) printf("%s - External\n", str);                 \
  }

#define PRINT_NAPI_STATUS(s /* status */, str)                                 \
{                                                                              \
  if (s == napi_ok) printf("%s - ok\n", str);                                  \
  if (s == napi_invalid_arg) printf("%s - invalid_arg\n", str);                \
  if (s == napi_object_expected) printf("%s - object_expected\n", str);        \
  if (s == napi_string_expected) printf("%s - string_expected\n", str);        \
  if (s == napi_name_expected) printf("%s - name_expected\n", str);            \
  if (s == napi_function_expected) printf("%s - function_expecte\n", str);     \
  if (s == napi_number_expected) printf("%s - number_expected\n", str);        \
  if (s == napi_boolean_expected) printf("%s - boolean_expected\n", str);      \
  if (s == napi_array_expected) printf("%s - array_expected\n", str);          \
  if (s == napi_generic_failure) printf("%s - generic_failure\n", str);        \
  if (s == napi_pending_exception) printf("%s - pending_exception\n", str);    \
  if (s == napi_cancelled) printf("%s - cancelled\n", str);                    \
}

#define PRINT_NAPI_ERROR_MESSAGE(status, str)                                  \
  {                                                                            \
    if (status != napi_ok) {                                                   \
      const napi_extended_error_info* result;                                  \
                                                                               \
      napi_get_last_error_info(env, &result);                                  \
      printf("%s - %s\n", str, result->error_message);                         \
    }                                                                          \
  }

#define MAYBE_PRINT_NAPI_JS_EXCEPTION(str)                                     \
  {                                                                            \
    bool is_exception_pending;                                                 \
    napi_status status_                                                        \
    status_ = napi_is_exception_pending(env_, &is_exception_pending);          \
    assert(status_ == napi_ok);                                                \
                                                                               \
    if (is_exception_pending) {                                                \
      napi_value last_exception;                                               \
      status_ = napi_get_and_clear_last_exception(env_,                        \
                                                 &last_exception);             \
      assert(status_ == napi_ok);                                              \
                                                                               \
                                                                               \
      napi_value stack;                                                        \
      status_ = napi_get_named_property(env,                                   \
                                        last_exception,                        \
                                        "stack",                               \
                                        &stack);                               \
      assert(status_ == napi_ok);                                              \
                                                                               \
      size_t string_length;                                                    \
      status_ = napi_get_value_string_latin1(env,                              \
                                             stack,                            \
                                             nullptr,                          \
                                             1000,                             \
                                             &string_length);                  \
      assert(status_ == napi_ok);                                              \
                                                                               \
      char* buf = new char[string_length];                                     \
                                                                               \
      status_ = napi_get_value_string_latin1(env,                              \
                                            stack,                             \
                                            buf,                               \
                                            string_length,                     \
                                            nullptr);                          \
      assert(status_ == napi_ok);                                              \
                                                                               \
      delete[] buf;                                                            \
                                                                               \
      printf("Exception at: %s was %s\n", str, buf);                           \
    }                                                                          \
  }

#define CONSOLE_LOG_JS_OBJECT(value, count)                                    \
  {                                                                            \
    napi_value global;                                                         \
    status = napi_get_global(env, &global);                                    \
    assert(status == napi_ok);                                                 \
                                                                               \
    napi_value console;                                                        \
    status = napi_get_named_property(env,                                      \
                                     global,                                   \
                                     "console",                                \
                                     &console);                                \
    assert(status == napi_ok);                                                 \
                                                                               \
    napi_value log_;                                                           \
    status = napi_get_named_property(env,                                      \
                                     console,                                  \
                                     "log",                                    \
                                     &log_);                                   \
    assert(status == napi_ok);                                                 \
                                                                               \
    status = napi_call_function(env,                                           \
                                console,                                       \
                                log_,                                          \
                                count,                                         \
                                value, /* c-style array */                     \
                                nullptr);                                      \
    assert(status == napi_ok);                                                 \
  }
