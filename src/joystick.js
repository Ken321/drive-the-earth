export const joyStickPipelineModule = () => {
  let joystickCenterX
  let joystickCenterY
  const joystickLimitNumber = 35
  let joystickInterval

  const joystick = document.createElement('div')
  joystick.id = 'joystick'
  joystick.className = 'joystick'

  const joystickFrame = document.createElement('div')
  joystickFrame.id = 'joystick-frame'
  joystickFrame.className = 'joystick-frame'
  joystick.appendChild(joystickFrame)

  const joystickBall = document.createElement('div')
  joystickBall.id = 'joystick-ball'
  joystickBall.className = 'joystick-ball'
  joystickFrame.appendChild(joystickBall)

  document.body.appendChild(joystick)

  const dragMove = (event) => {
    event.preventDefault()
    clearInterval(joystickInterval)

    const {pageX} = event.touches[0]
    const {pageY} = event.touches[0]

    let touchX
    if (Math.abs(pageX - joystickCenterX) < joystickLimitNumber) {
      touchX = pageX - joystickCenterX
    } else if (pageX - joystickCenterX > 0) {
      touchX = joystickLimitNumber
    } else {
      touchX = -joystickLimitNumber
    }

    let touchY
    if (Math.abs(pageY - joystickCenterY) < joystickLimitNumber) {
      touchY = pageY - joystickCenterY
    } else if (pageY - joystickCenterY > 0) {
      touchY = joystickLimitNumber
    } else {
      touchY = -joystickLimitNumber
    }

    joystickBall.style.left = `calc(50% + ${touchX}px)`
    joystickBall.style.top = `calc(50% + ${touchY}px)`

    const vector2d = new THREE.Vector2(touchX, touchY)
    const customEvent = new CustomEvent('joystickmove', {detail: vector2d})

    joystickInterval = setInterval(() => {
      document.dispatchEvent(customEvent)
    }, 25)
  }

  const dragLeave = () => {
    joystickBall.style.top = '50%'
    joystickBall.style.left = '50%'
    clearInterval(joystickInterval)

    const leaveEvent = new Event('joystickend')
    document.dispatchEvent(leaveEvent)
  }

  const setupJoystick = () => {
    joystickCenterX =
    joystickBall.getBoundingClientRect().left + joystickBall.clientWidth / 2
    joystickCenterY =
    joystickBall.getBoundingClientRect().top + joystickBall.clientHeight / 2
    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault()
    })
    joystick.addEventListener('touchmove', (e) => {
      e.preventDefault()
    })
    joystickBall.addEventListener('touchstart', dragMove)
    joystickBall.addEventListener('touchmove', dragMove)
    joystickBall.addEventListener('touchend', dragLeave)
    window.addEventListener('resize', () => {
      joystickCenterX =
    joystickBall.getBoundingClientRect().left + joystickBall.clientWidth / 2
      joystickCenterY =
    joystickBall.getBoundingClientRect().top + joystickBall.clientHeight / 2
    })
  }

  return {
    name: 'joy-stick',
    onStart: ({canvas}) => {
      setupJoystick()
    },
  }
}
