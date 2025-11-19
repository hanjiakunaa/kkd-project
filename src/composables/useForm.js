import { cloneDeep } from 'lodash-es'

export function useForm(initFormData = {}) {
  const formRef = ref(null)
  const formModel = ref(cloneDeep(initFormData))
  const rules = {
    required: {
      required: true,
      message: '此为必填项',
      trigger: ['blur', 'change'],
    },
  }
  const validation = () => {
    return formRef.value?.validate()
  }
  return [formRef, formModel, validation, rules]
}

export function useNaiveForm() {
  const formRef = ref(null)

  async function validate() {
    await formRef.value?.validate()
  }

  async function restoreValidation() {
    formRef.value?.restoreValidation()
  }

  return [formRef, validate, restoreValidation]
}
