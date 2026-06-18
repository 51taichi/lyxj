export function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent)
}

function copyTextLegacy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)

  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }

  document.body.removeChild(textarea)
  return ok
}

export function selectInputText(input: HTMLInputElement | HTMLTextAreaElement): void {
  input.focus()
  input.select()
  input.setSelectionRange(0, input.value.length)
}

/** 优先选中输入框再复制，微信内成功率更高 */
export function copyFromInput(input: HTMLInputElement | HTMLTextAreaElement): boolean {
  selectInputText(input)
  try {
    if (document.execCommand('copy')) return true
  } catch {
    // fall through
  }
  return copyTextLegacy(input.value)
}

export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // WeChat 内置浏览器常禁用 Clipboard API
    }
  }
  return copyTextLegacy(text)
}

export function copyHintMessage(copied: boolean, inWeChat = isWeChatBrowser()): string {
  if (copied) return '链接已复制，回到聊天窗口粘贴发送即可'
  if (inWeChat) return '请长按下方链接 → 选择「拷贝」，或点一下链接再点「复制」'
  return '请长按或全选下方链接手动复制'
}
