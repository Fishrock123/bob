#ifndef BOB_H_
#define BOB_H_

enum Status {
  ERROR = -1,
  END = 0,
  CONTINUE = 1
};

class Bob_Base {
 public:
  virtual ~Bob_Base();

  virtual Bob_Base* BindSource(Bob_Base* source) = 0;
  virtual void BindSink(Bob_Base* sink) = 0;
  virtual void Next(int status, void** error, char* data, size_t bytes) = 0;
  virtual void Pull(void** error, char* data, size_t size) = 0;
};

#endif  // BOB_H_
