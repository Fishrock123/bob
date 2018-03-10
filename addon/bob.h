#ifndef BOB_H_
#define BOB_H_

enum Status {
  ERROR = -1,
  END = 0,
  CONTINUE = 1
}

class Sink;

class Source {
 public:
  virtual ~Source() {}

  virtual void BindSink(Sink* sink);
  virtual void Pull(void** error, char* data, size_t size);
};

class Sink {
 public:
  virtual ~Sink() {}

  virtual Sink* BindSource(Source* source);
  virtual void Next(int status, void** error, char* data, size_t bytes);
};

#endif  // BOB_H_
