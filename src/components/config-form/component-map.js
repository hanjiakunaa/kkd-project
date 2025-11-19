/** Component list, register here to setting it in the form */
import {
  NCascader,
  NCheckboxGroup,
  NDatePicker,
  NDivider,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NRate,
  NSelect,
  NSwitch,
  NTimePicker,
  NTreeSelect,
} from 'naive-ui'

const componentMap = {
  Input: NInput,
  InputNumber: NInputNumber,
  Select: NSelect,
  TreeSelect: NTreeSelect,
  Switch: NSwitch,
  Radio: NRadioGroup,
  Checkbox: NCheckboxGroup,
  Cascader: NCascader,
  Rate: NRate,
  DatePicker: NDatePicker,
  DateTimerange: NDatePicker, // datetimerange 使用 DatePicker 组件
  Daterange: NDatePicker, // daterange 使用 DatePicker 组件
  DateTime: NDatePicker, // datetime 使用 DatePicker 组件
  TimePicker: NTimePicker,
  Divider: NDivider,
}

const optionsComponentMap = {
  Radio: NRadio,
  Checkbox: NCheckboxGroup,
}

export { componentMap, optionsComponentMap }
