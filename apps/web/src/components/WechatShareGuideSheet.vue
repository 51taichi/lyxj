<script setup lang="ts">
import { ref, watch } from 'vue'
import { copyText } from '../utils/wechatEnv'

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

watch(
  () => props.open,
  (open) => {
    if (open) {
      copyHint.value = props.linkCopied ? '链接已复制，可直接粘贴发送' : ''
    }
  },
)

async function onCopyLink() {
  const ok = await copyText(props.shareUrl)
  copyHint.value = ok ? '链接已复制' : '请长按下方链接框全选复制'
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
            <li>点击 <strong>复制链接</strong></li>
            <li>回到微信，打开客户聊天窗口</li>
            <li><strong>粘贴并发送</strong>，客户点开即可查看方案</li>
          </ol>
        </template>

        <label v-if="mode !== 'pdf'" class="wx-sheet__url-label">客户页面链接</label>
        <input
          v-if="mode !== 'pdf'"
          class="wx-sheet__url"
          :value="shareUrl"
          readonly
          @focus="($event.target as HTMLInputElement).select()"
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
