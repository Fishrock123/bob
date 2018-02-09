#include <node_api.h>

#define PRINT_NAPI_TYPE(value, str)                                                 \
  {                                                                                 \
    napi_valuetype type;                                                            \
    napi_status status = napi_typeof(env, value, &type);                            \
    assert(status == napi_ok);                                                      \
                                                                                    \
    if (type == napi_undefined) printf("%s - undefined\n", str);                    \
    if (type == napi_null) printf("%s - null\n", str);                              \
    if (type == napi_boolean) printf("%s - boolean\n", str);                        \
    if (type == napi_number) printf("%s - number\n", str);                          \
    if (type == napi_string) printf("%s - string\n", str);                          \
    if (type == napi_symbol) printf("%s - symbol\n", str);                          \
    if (type == napi_object) printf("%s - Object\n", str);                          \
    if (type == napi_function) printf("%s - Function\n", str);                      \
    if (type == napi_external) printf("%s - External\n", str);                      \
  }

#define PRINT_NAPI_STATUS(status, str) \
{ \
  if (status == napi_ok) printf("%s - ok\n", str); \
  if (status == napi_invalid_arg) printf("%s - invalid_arg\n", str);           \
  if (status == napi_object_expected) printf("%s - object_expected\n", str);        \
  if (status == napi_string_expected) printf("%s - string_expected\n", str);      \
  if (status == napi_name_expected) printf("%s - name_expected\n", str);       \
  if (status == napi_function_expected) printf("%s - function_expecte\n", str);          \
  if (status == napi_number_expected) printf("%s - number_expected\n", str);          \
  if (status == napi_boolean_expected) printf("%s - boolean_expected\n", str);      \
  if (status == napi_array_expected) printf("%s - array_expected\n", str); \
  if (status == napi_generic_failure) printf("%s - generic_failure\n", str); \
  if (status == napi_pending_exception) printf("%s - pending_exception\n", str); \
  if (status == napi_cancelled) printf("%s - cancelled\n", str); \
}
// if (status == napi_status_last) printf("%s - status_last\n", str); \ // ????

#define PRINT_NAPI_ERROR_MESSAGE(status, str)                                            \
  {                                                                                 \
    if (status != napi_ok) {                                                        \
      const napi_extended_error_info* result;                                       \
                                                                                    \
      napi_get_last_error_info(env, &result);                                       \
      printf("%s - %s\n", str, result->error_message);                              \
    }                                                                               \
  }
