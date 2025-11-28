/**
 * 节点执行器基类
 * 定义所有节点执行器的统一接口
 */

export class BaseExecutor {
  constructor() {
    this.name = 'BaseExecutor'
  }

  /**
   * 执行节点逻辑
   * @param {Object} node - 节点对象
   * @param {any} input - 输入数据
   * @param {Object} context - 执行上下文
   * @returns {Promise<any>} - 输出数据
   */
  async execute(node, input, context) {
    throw new Error(`${this.name}.execute() must be implemented`)
  }

  /**
   * 验证节点配置
   * @param {Object} node - 节点对象
   * @returns {Object} - {valid: boolean, error: string}
   */
  validate(node) {
    return { valid: true, error: null }
  }

  /**
   * 获取节点的预估执行时间（毫秒）
   * @param {Object} node - 节点对象
   * @returns {number}
   */
  getEstimatedDuration(node) {
    return 1000 // 默认 1 秒
  }

  /**
   * 获取节点的预估成本（美元）
   * @param {Object} node - 节点对象
   * @returns {number}
   */
  getEstimatedCost(node) {
    return 0
  }

  /**
   * 格式化输出结果
   * @param {any} output - 原始输出
   * @param {string} format - 格式类型
   * @returns {any}
   */
  formatOutput(output, format = 'text') {
    if (format === 'text') {
      return String(output)
    }
    if (format === 'json') {
      return typeof output === 'string' ? output : JSON.stringify(output, null, 2)
    }
    return output
  }
}

