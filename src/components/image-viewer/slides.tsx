import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'
import { Slide } from './slide'
import { convertPx } from '../../utils/convert-px'
import { bound } from '../../utils/bound'
import { MultiImageViewRef } from './image-viewer'

const classPrefix = `adm-image-viewer`
interface Props {
  images: string[]
  onTap: () => void
  maxZoom: number
  defaultIndex: number
  onIndexChange?: (index: number) => void
}
export const Slides = forwardRef<MultiImageViewRef, Props>((props, ref) => {
  const slideWidth = window.innerWidth + convertPx(16)

  const [{ x }, api] = useSpring(() => ({
    x: props.defaultIndex * slideWidth,
    config: { tension: 250, clamp: true },
  }))

  const count = props.images.length
  useImperativeHandle(
    ref,
    () => {
      return {
        swipeTo: index => {
          api.start({
            x: index * slideWidth,
          })
        },
      }
    },
    []
  )
  const dragLockRef = useRef(false)
  const bind = useDrag(
    state => {
      if (dragLockRef.current) return
      const [offsetX] = state.offset
      if (state.last) {
        const minIndex = Math.floor(offsetX / slideWidth)
        const maxIndex = minIndex + 1
        const velocityOffset =
          Math.min(state.velocity[0] * 2000, slideWidth) * state.direction[0]
        const index = bound(
          bound(
            Math.round((offsetX + velocityOffset) / slideWidth),
            minIndex,
            maxIndex
          ),
          0,
          count - 1
        )
        props.onIndexChange?.(index)
        api.start({
          x: index * slideWidth,
        })
      } else {
        api.start({
          x: offsetX,
          immediate: true,
        })
      }
    },
    {
      transform: ([x, y]) => [-x, y],
      from: () => [x.get(), 0],
      bounds: () => {
        return {
          left: 0,
          right: (count - 1) * slideWidth,
        }
      },
      rubberband: true,
      axis: 'x',
      pointer: { touch: true },
    }
  )

  return (
    <div className={`${classPrefix}-slides`} {...bind()}>
      <animated.div className={`${classPrefix}-indicator`}>
        {x.to(v => {
          const index: number = bound(Math.round(v / slideWidth), 0, count - 1)
          return `${index + 1} / ${count}`
        })}
      </animated.div>
      <animated.div
        className={`${classPrefix}-slides-inner`}
        style={{ x: x.to(x => -x) }}
      >
        {props.images.map(image => (
          <Slide
            key={image}
            image={image}
            onTap={props.onTap}
            maxZoom={props.maxZoom}
            onZoomChange={zoom => {
              if (zoom !== 1) {
                const index: number = Math.round(x.get() / slideWidth)
                api.start({
                  x: index * slideWidth,
                })
              }
            }}
            dragLockRef={dragLockRef}
          />
        ))}
      </animated.div>
    </div>
  )
})
