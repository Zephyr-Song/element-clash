/**
 * ObjectPool.ts - 通用对象池<T>
 * 用于复用DOM元素，减少GC压力
 */

/**
 * 通用对象池
 * 管理可复用对象的创建和回收
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  /**
   * @param factory 创建新对象的工厂函数
   * @param reset 重置对象状态的函数
   * @param initialSize 初始池大小
   * @param maxSize 最大池大小(防止内存泄漏)
   */
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 5,
    maxSize: number = 30
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // 预创建初始对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /**
   * 从池中获取一个对象
   * 如果池空则创建新对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /**
   * 将对象归还到池中
   * 超过最大限制则丢弃
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * 获取当前池中可用对象数量
   */
  get available(): number {
    return this.pool.length;
  }
}
