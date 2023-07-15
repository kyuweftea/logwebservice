module.exports = class CircularQueueNonBlocking {

  constructor(capacity) {
    this.capacity = capacity;
    this.storage = Array(capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  enqueue(elem) {
    this.storage[this.tail] = elem;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.capacity == this.size) {
      this.head = (this.head + 1) % this.capacity;
    } else {
      this.size++;
    }
  }

  dequeue() {
    if (this.size == 0) {
      throw new Error("circular queue is empty");
    }

    let elem = this.storage[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.size--;

    return elem;
  }

}
