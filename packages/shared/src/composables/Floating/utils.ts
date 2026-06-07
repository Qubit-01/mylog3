import { ref, watch, onMounted, getCurrentInstance, type Ref } from 'vue'
import {
  autoUpdate,
  useFloating,
  type UseFloatingOptions,
} from '@floating-ui/vue'

/**
 * 相对定位的元素
 * 不传=传false，默认找同级前一个兄弟元素
 * 传true，找父元素
 * 传元素或选择器，指定元素
 */
export type Relate = undefined | boolean | HTMLElement | string

/**
 * 自动获取参考元素，计算浮动元素位置
 * @param floating 浮动元素，ref
 * @param options 浮动元素配置项
 * @param previous 是否找上一个兄弟元素作为参考元素，默认找当前组件父元素作为参考元素
 */
export const useFloatingRelate = (
  floating: Ref<HTMLElement | undefined>,
  relate: Ref<Relate>,
  options: UseFloatingOptions,
) => {
  // 相对元素
  const reference = ref<Element>()

  onMounted(() => {
    watch(
      relate,
      () => {
        if (!Boolean(relate.value))
          reference.value = getCurrentInstance()?.proxy?.$el
            .previousElementSibling as HTMLElement // 获取上一个兄弟元素
        else if (relate.value === true)
          reference.value = getCurrentInstance()?.proxy?.$el
            .parentElement as HTMLElement // 获取父元素
        else if (relate.value instanceof HTMLElement)
          reference.value = relate.value // 直接传入元素就直接赋值进去
        else if (typeof relate.value === 'string')
          reference.value = document.querySelector(relate.value) as HTMLElement // 通过CSS选择器查询相对元素
        // console.log('LSQ> ', reference.value);

        if (!reference.value)
          throw new Error(
            'Floating 找不到参考元素，请检查relate传参或前一个兄弟元素是否存在',
          )
      },
      { immediate: true },
    )
  })

  const useFloatingReturn = useFloating(reference, floating, {
    whileElementsMounted: autoUpdate,
    ...options,
  })

  return { reference, ...useFloatingReturn }
}
