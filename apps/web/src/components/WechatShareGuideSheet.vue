<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { copyFromInput, copyHintMessage, copyText, isWeChatBrowser, selectInputText } from '../utils/wechatEnv'

const props = defineProps<{
  open: boolean
  shareUrl: string
  linkCopied?: boolean
  mode?: 'link' | 'pdf'
}>()

const emit = defineEmits<{
  close: []
}>()

const copyHint = ref('')
const urlInputRef = ref<HTMLInputElement | null>(null)
const inWeChat = isWeChatBrowser()

async function tryAutoCopy() {
  if (props.mode === 'pdf' || !props.shareUrl) return

  await nextTick()
  const input = urlInputRef.value
  if (input) {
    if (copyFromInput(input)) {
      copyHint.value = copyHintMessage(true, inWeChat)
      return
    }
  }

  const ok = await copyText(props.shareUrl)
  copyHint.value = copyHintMessage(ok, inWeChat)
}

watch(
  () => props.open,
  (open) => {
    if (open && props.mode !== 'pdf') {
      void tryAutoCopy()
    } else if (!open) {
      copyHint.value = ''
    }
  },
)

async function onCopyLink() {
  const input = urlInputRef.value
  if (input && copyFromInput(input)) {
    copyHint.value = copyHintMessage(true, inWeChat)
    return
  }
  const ok = await copyText(props.shareUrl)
  copyHint.value = copyHintMessage(ok, inWeChat)
}

function onUrlFocus(event: FocusEvent) {
  selectInputText(event.target as HTMLInputElement)
}

function onUrlClick(event: MouseEvent) {
  selectInputText(event.target as HTMLInputElement)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="wx-sheet" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="wx-sheet__panel">
        <button type="button" class="wx-sheet__close" aria-label="关闭" @click="emit('close')">×</button>

        <template v-if="mode === 'pdf'">
          <h3 class="wx-sheet__title">PDF 已下载</h3>
          <p class="wx-sheet__lead">PDF 在微信里不方便转发，建议优先用「发给客户（链接）」或「生成长图」。</p>
          <ol class="wx-sheet__steps">
            <li>若需 PDF：到手机「文件管理」或微信「我 → 收藏/文件」中查找</li>
            <li>发给客户：更推荐分享链接，或发送长图</li>
          </ol>
        </template>

        <template v-else>
          <h3 class="wx-sheet__title">发给客户</h3>
          <p class="wx-sheet__lead">请把<strong>客户页面链接</strong>发到微信聊天，不要直接点右上角分享当前页。</p>
          <ol class="wx-sheet__steps">
            <li v-if="inWeChat">点 <strong>复制链接</strong>，或<strong>长按下方链接 → 拷贝</strong></li>
            <li v-else>点击 <strong>复制链接</strong></li>
            <li>回到微信，打开客户聊天窗口</li>
            <li><strong>粘贴并发送</strong>，客户点开即可查看方案</li>
          </ol>
        </template>

        <label v-if="mode !== 'pdf'" class="wx-sheet__url-label">客户页面链接（点一下可全选）</label>
        <input
          v-if="mode !== 'pdf'"
          ref="urlInputRef"
          class="wx-sheet__url"
          :value="shareUrl"
          readonly
          @focus="onUrlFocus"
          @click="onUrlClick"
        />

        <div class="wx-sheet__actions">
          <button v-if="mode !== 'pdf'" type="button" class="btn-primary wx-sheet__btn" @click="onCopyLink">
            复制链接
          </button>
          <button type="button" class="btn-outline wx-sheet__btn" @click="emit('close')">
            知道了
          </button>
        </div>

        <p v-if="copyHint" class="wx-sheet__hint">{{ copyHint }}</p>
      </div>
    </div>
  </Teleport>
</template>
