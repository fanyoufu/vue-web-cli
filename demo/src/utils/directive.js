/***
 * eg:
 *    <div v-clickoutside="funcName"></div>
 * params:
 *    funcName: 在此元素之外的地方点击鼠标时需要调用的函数
 */
const clickoutside = {
  // 初始化指令
  bind(el, binding, vnode) {
    function documentHandler(e) {
      // 这里判断点击的元素是否是本身，是本身，则返回
      if (el.contains(e.target)) {
        return false
      }
      // 判断指令中是否绑定了函数
      if (binding.expression) {
        // 如果绑定了函数 则调用那个函数，此处binding.value就是handleClose方法
        binding.value(e)
      }
    }
    // 给当前元素绑定个私有变量，方便在unbind中可以解除事件监听
    el.__vueClickOutside__ = documentHandler
    document.addEventListener('click', documentHandler)
  },
  update() {},
  unbind(el, binding) {
    // 解除事件监听
    document.removeEventListener('click', el.__vueClickOutside__)
    delete el.__vueClickOutside__
  }
}

/***
 * eg:
 *    <div v-draggable="funcName"></div>
 * params:
 *    funcName: 在此元素之外的地方点击鼠标时需要调用的函数
 */
const draggable = {
  // 初始化指令
  bind(el, binding, vnode) {
    // el.draggable="true"
    el.dragData = {
      pageX: 0,
      pageY: 0,
      top: 0,
      left: 0
    }
    function dragend(e) {
      console.info('dragend', e)
    }
    function dragstart(e) {
      console.info(e)

      el.dragData.pageX = e.pageX
      el.dragData.pageY = e.pageY
      el.dragData.top = parseInt(el.style.top)
      el.dragData.left = parseInt(el.style.left)
    }

    function drag(e) {
      console.info('drag', e)
      if (e.pageX > 0 && e.pageY > 0) {
        let dx = e.pageX - el.dragData.pageX
        let dy = e.pageY - el.dragData.pageY

        el.style.top = el.dragData.top + dy + 'px'
        el.style.left = el.dragData.left + dx + 'px'
      }
    }
    // 给当前元素绑定个私有变量，方便在unbind中可以解除事件监听
    el.__vueDragstart__ = dragstart
    el.__vueDrag__ = drag
    el.__vueDragend__ = dragend
    el.addEventListener('dragstart', dragstart)
    el.addEventListener('drag', drag)
    el.addEventListener('dragend', dragend)
  },
  update() {},
  unbind(el, binding) {
    // 解除事件监听
    document.removeEventListener('drag', el.__vueDrag__)
    document.removeEventListener('dragstart', el.__vueDragstart__)
    document.removeEventListener('dragend', el.__vueDragend__)
    delete el.__vueDrag__
    delete el.__vueDragstart__
    delete el.__vueDragend__
  }
}

const drag = {
  currentNode: null,

  bind: (el, binding, vnode) => {
    el.handleDragStart = function(e) {
      e.target.classList.add('dragging')
      e.dataTransfer.effectAllowed = 'move'
      // Need to set to something or else drag doesn't start
      e.dataTransfer.setData('text', '*')
      vnode.context.$emit('dragStart')
      drag.currentNode = e.target
      console.info('handleDragStart', e.target.dataset.order)
    }

    el.handleDragOver = function(e) {
      if (e.preventDefault) {
        // allows dropping
        e.preventDefault()
      }

      e.dataTransfer.dropEffect = 'move'
      e.target.classList.add('drag-over')
      vnode.context.$emit('drag-over')

      return false
    }.bind(this)

    el.handleDragEnter = function(e) {
      vnode.context.$emit('drag-enter')
      e.target.classList.add('drag-enter')
    }.bind(this)

    el.handleDragLeave = function(e) {
      console.info('drag-leave', e.target, el)
      vnode.context.$emit('drag-leave')
      e.target.classList.remove('drag-enter', 'drag-over')
    }.bind(this)

    el.handleDrag = function() {
      vnode.context.$emit('drag')
    }.bind(this)

    el.handleDragEnd = function(e) {
      console.info('handleDragEnd', e.target, el)
      e.target.classList.remove('dragging', 'drag-over', 'drag-enter')
      // vnode.context.$emit('drag-end');
    }.bind(this)

    el.handleDrop = function(e) {
      e.preventDefault()
      if (e.stopPropagation) {
        // stops the browser from redirecting.
        e.stopPropagation()
      }

      // if(drag.currentNode.dataset.order > -1 && e.target.dataset.order > -1){
      //   [e.target.style.order,drag.currentNode.style.order] = [drag.currentNode.style.order,e.target.style.order]
      // }

      //console.info("handleDrop",vnode.context)
      e.target.classList.remove('dragging', 'drag-over', 'drag-enter')

      // Don't do anything if dropping the same column we're dragging.
      // vnode.context.$emit('drop',{start:drag.currentNode.dataset.order, end:e.target.dataset.order});

      binding.value(drag.currentNode.dataset.order, e.target.dataset.order)

      return false
    }.bind(drag)

    // setup the listeners
    el.setAttribute('draggable', 'true')
    el.addEventListener('dragstart', el.handleDragStart, false)
    el.addEventListener('dragenter', el.handleDragEnter, false)
    el.addEventListener('dragover', el.handleDragOver, false)
    el.addEventListener('drag', el.handleDrag, false)
    el.addEventListener('dragleave', el.handleDragLeave, false)
    el.addEventListener('dragend', el.handleDragEnd, false)
    el.addEventListener('drop', el.handleDrop, false)
  },
  unbind: function(el) {
    // shut er' down
    el.classList.remove('dragging', 'drag-over', 'drag-enter')
    el.removeAttribute('draggable')
    el.removeEventListener('dragstart', el.handleDragStart)
    el.removeEventListener('dragenter', el.handleDragEnter)
    el.removeEventListener('dragover', el.handleDragOver)
    el.removeEventListener('dragleave', el.handleDragLeave)
    el.removeEventListener('drag', el.handleDrag)

    delete el.handleDragStart
    delete el.handleDragEnter
    delete el.handleDragOver
    delete el.handleDragLeave
    delete el.handleDrag
  }
}

/**
 *
 * 如果不是数字，就加一个特殊的css类
 */
const mustBenumber = {
  bind: function(el, binding, vnode) {
    el.isNumber = function() {
      if (isNaN(el.value.trim())) {
        if (binding.expression) {
          el.classList.add(binding.value)
        }
        //el.style.outline = '#FF0000 solid thick'
        el.title = el.value.trim() + '不是数字'
      } else {
        if (binding.expression) {
          el.classList.remove(binding.value)
        }
        el.title = ''
      }
    }
    el.addEventListener('blur', el.isNumber)
  },
  unbind: function(el, binding) {
    el.removeEventListener('blur', el.isNumber)
    delete el.isNumber
  }
}

/**
 * 跳动的数值
 * 
 * 默认1秒内跳转完成。 这个时间是可以设置的：
 *   <h1 v-jumpNumber="yourTime">1000</h1>
 *   yourTime以秒为单位。
 * 
 * 由于最小步长是1，动画部分只对整数有效，你设置的总时长可能因为值过小而失效。
 * 
 * 支持的格式如下：
 * 负数
 * 百分号
 * 浮点数
 * 整数
 * 金额计数法 123,000
 *
 * eg:  
  <h1 v-jumpNumber>60.00%</h1>
  <h1 v-jumpNumber>0.00%</h1>
  <h1 v-jumpNumber="1">100</h1>
  <span v-jumpNumber>100%</span>
  <h1 v-jumpNumber="2">1000.21%</h1>
  <h1 ><span v-jumpNumber>12,000.21%</span></h1>
  <h1 v-jumpNumber>-1,21,000.21%</h1>
  <h1 v-jumpNumber>-1000.21</h1>
  <h1 v-jumpNumber>-1000a.21</h1>
 */
const jumpNumber = {
  bind: function(el, binding, vnode) {
    let step = 50
    if (!isNaN(binding.value)) {
      let totalTime = parseInt(binding.value)
      if (totalTime > 0) {
        step = (binding.value * 1000) / 20
      }
    }
    el.initNumber = function(vnode) {
      if (!vnode.children[0]) {
        return false
      }
      if (!vnode.children[0].text) {
        return false
      }
      let initText = vnode.children[0].text.trim()
      if ('' === initText) {
        return false
      }

      let percentPlaceHold = ''
      let fractional = ''
      let intNumber = 0
      let sign = ''

      let str = initText

      str = vnode.children[0].text.replace(/\,/g, '')
      // 多个 - 号
      if (str.replace(/[^%]/g, '').length > 1) {
        return false
      }
      if (str.replace(/[^-]/g, '').length > 1) {
        return false
      }

      if (str.replace(/[^.]/g, '').length > 1) {
        return false
      }

      if (isNaN(str.replace(/[%,]/g, ''))) {
        return false
      }

      if (str.indexOf('-') > -1) {
        if (str.indexOf('-') !== 0) {
          return false
        } else {
          sign = '-'
          str = str.replace('-', '')
        }
      }

      if (str.indexOf('%') > -1) {
        if (str.substr(-1) !== '%') {
          return false
        } else {
          percentPlaceHold = '%'
          str = str.replace('%', '')
        }
      }
      if (str.replace(/[^.]/g, '').length === 1) {
        let arr = str.split('.')
        intNumber = parseInt(arr[0])
        fractional = '.' + arr[1]
      } else {
        intNumber = parseInt(str)
      }
      // console.info(initText, intNumber, percentPlaceHold, fractional)

      return { intNumber, percentPlaceHold, fractional, initText, sign }
    }

    el.jump = function(vnode) {
      let rs = el.initNumber(vnode)
      if (!rs) {
        console.warn('jumpNumber必须是数值，而得到的是' + vnode.children[0].text)
        return false
      }
      let { intNumber, percentPlaceHold, fractional, initText, sign } = rs
      if (intNumber === 0) {
        return
      }
      el.targetData = intNumber
      el.startData = 0
      el.innerHTML = el.startData + fractional + percentPlaceHold

      let dt = Math.ceil((el.targetData - el.startData) / step)
      el.timerId = setInterval(function() {
        el.startData += dt

        if (el.startData > el.targetData) {
          el.innerHTML = initText
          clearInterval(el.timerId)
        } else {
          el.innerHTML = sign + el.startData + fractional + percentPlaceHold
        }
      }, 20)
    }
    el.jump(vnode)
  },
  unbind: function(el, binding) {
    if (el.timerId) {
      clearInterval(el.timerId)
    }
    el.initNumber = null
    el.jump = null
  },
  update: function(el, binding, vnode) {
    if (el.timerId) {
      clearInterval(el.timerId)
    }
    el.jump(vnode)
  }
}

// el-table__header-wrapper

const fixedTableHeader = {
  // 初始化指令
  bind(el, binding, vnode) {
    let tableRef = binding.value // el.draggable="true"
    if (el.style.height !== '') {
      return
    }

    setTimeout(() => {
      let headerRef = el.querySelector('.el-table__header-wrapper')
      let table__fixed = el.querySelector('.el-table__fixed')
      console.info(table__fixed)
      let headerFixedRef = el.querySelector('.el-table__fixed-header-wrapper')

      if (headerRef) {
        el.__handlerScroll__ = function(e) {
          let { top } = el.getBoundingClientRect()
          if (top < 0) {
            Object.assign(headerRef.style, { position: 'fixed', top: 0, zIndex: 1 })
            headerFixedRef && Object.assign(headerFixedRef.style, { position: 'fixed', top: 0, zIndex: 1 })
          } else {
            Object.assign(headerRef.style, { position: 'static', top: 0, zIndex: 'auto' })
            headerFixedRef && Object.assign(headerFixedRef.style, { position: 'static', top: 0, zIndex: 'auto' })
          }
          console.info()
        }

        document.addEventListener('scroll', el.__handlerScroll__)
      }
    })

    // 给当前元素绑定个私有变量，方便在unbind中可以解除事件监听
  },
  update() {},
  unbind(el, binding) {
    // 解除事件监听
    document.removeEventListener('scroll', el.__handlerScroll__)

    delete el.__handlerScroll__
  }
}

export default {
  mustBenumber,
  jumpNumber,
  drag,
  clickoutside,
  draggable,
  fixedTableHeader
}
