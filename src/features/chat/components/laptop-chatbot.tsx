'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import {
  BotIcon,
  BriefcaseBusinessIcon,
  BrushIcon,
  CheckIcon,
  ChevronRightIcon,
  Code2Icon,
  CopyIcon,
  CpuIcon,
  Gamepad2Icon,
  GraduationCapIcon,
  LaptopIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type LaptopTopic =
  | 'general'
  | 'gaming'
  | 'programming'
  | 'study'
  | 'business'
  | 'creative'
  | 'upgrade'
  | 'troubleshooting';

const topicSuggestions = {
  general: {
    label: 'Khám phá',
    icon: LaptopIcon,
    prompts: [
      {
        text: 'Giúp tôi chọn laptop',
        description: 'Bắt đầu với ngân sách, nhu cầu và tính di động.',
        icon: LaptopIcon,
      },
      {
        text: 'Thông số tốt nhất cho lập trình',
        description: 'Chọn RAM, CPU, pin và màn hình cho phát triển.',
        icon: Code2Icon,
      },
      {
        text: 'Laptop gaming dưới 1.500 USD',
        description: 'Cân bằng sức mạnh GPU, tản nhiệt và chất lượng màn hình.',
        icon: Gamepad2Icon,
      },
      {
        text: 'Laptop nhẹ cho đại học',
        description: 'Ưu tiên tính di động, thời lượng pin và độ bền.',
        icon: GraduationCapIcon,
      },
    ],
    followUps: ['So sánh tùy chọn CPU', 'Tôi cần bao nhiêu RAM?', 'Pin vs hiệu năng'],
  },
  gaming: {
    label: 'Gaming',
    icon: Gamepad2Icon,
    prompts: [
      {
        text: 'Laptop gaming dưới 1.000 USD',
        description: 'Chọn GPU mạnh nhất thực tế trong tầm ngân sách.',
        icon: Gamepad2Icon,
      },
      {
        text: 'Laptop RTX 4060 vs RTX 4070',
        description: 'So sánh hiệu năng gaming thực tế, công suất và giá.',
        icon: CpuIcon,
      },
      {
        text: 'Màn hình tốt nhất cho gaming cạnh tranh',
        description: 'Chọn tần số quét, thời gian phản hồi và độ phân giải.',
        icon: LaptopIcon,
      },
      {
        text: 'Tản nhiệt laptop quan trọng thế nào?',
        description: 'Hiểu về nhiệt độ, tiếng ồn và FPS duy trì.',
        icon: WrenchIcon,
      },
    ],
    followUps: ['Nên chọn GPU nào?', '16 GB RAM đủ cho gaming không?', 'So sánh 144 Hz và 240 Hz'],
  },
  programming: {
    label: 'Lập trình',
    icon: Code2Icon,
    prompts: [
      {
        text: 'Laptop cho phát triển web',
        description: 'Cân bằng CPU, RAM, pin và chất lượng bàn phím.',
        icon: Code2Icon,
      },
      {
        text: 'Laptop cho Docker và máy ảo',
        description: 'Ưu tiên bộ nhớ, CPU đa nhân và lưu trữ.',
        icon: CpuIcon,
      },
      {
        text: 'MacBook hay Windows cho lập trình?',
        description: 'So sánh công cụ, tương thích và quy trình làm việc.',
        icon: LaptopIcon,
      },
      {
        text: 'Lập trình viên cần bao nhiêu RAM?',
        description: 'Chọn giữa 16 GB, 32 GB và hơn thế.',
        icon: CpuIcon,
      },
    ],
    followUps: [
      'Tôi có cần 32 GB RAM không?',
      'Intel hay AMD cho phát triển?',
      'MacBook vs laptop Windows',
    ],
  },
  study: {
    label: 'Học tập',
    icon: GraduationCapIcon,
    prompts: [
      {
        text: 'Laptop giá rẻ cho đại học',
        description: 'Tìm laptop đáng tin cậy cho ghi chú và bài tập.',
        icon: GraduationCapIcon,
      },
      {
        text: 'Laptop nhẹ với pin lâu',
        description: 'Ưu tiên trọng lượng, thời lượng pin và sạc.',
        icon: LaptopIcon,
      },
      {
        text: 'Laptop cho sinh viên kỹ thuật',
        description: 'Kiểm tra yêu cầu phần mềm, CPU, GPU và RAM.',
        icon: CpuIcon,
      },
      {
        text: 'Chromebook hay laptop Windows?',
        description: 'So sánh giá cả và tương thích phần mềm.',
        icon: LaptopIcon,
      },
    ],
    followUps: [
      'Tôi cần thời lượng pin bao lâu?',
      '8 GB RAM đủ cho học tập không?',
      'Kích thước màn hình nào dễ mang theo nhất?',
    ],
  },
  business: {
    label: 'Doanh nhân',
    icon: BriefcaseBusinessIcon,
    prompts: [
      {
        text: 'Laptop doanh nhân cho công việc văn phòng',
        description: 'Chọn độ tin cậy, pin, webcam và cổng kết nối.',
        icon: BriefcaseBusinessIcon,
      },
      {
        text: 'Laptop cho công tác thường xuyên',
        description: 'Ưu tiên trọng lượng nhẹ, độ bền và sạc.',
        icon: LaptopIcon,
      },
      {
        text: 'Tính năng bảo mật laptop tốt nhất',
        description: 'Xem xét sinh trắc học, TPM, quyền riêng tư và cập nhật.',
        icon: ShieldCheckIcon,
      },
      {
        text: 'Tôi có cần dock laptop doanh nhân không?',
        description: 'Lên kế hoạch màn hình, Ethernet, sạc và thiết bị ngoại vi.',
        icon: CpuIcon,
      },
    ],
    followUps: ['Tôi cần cổng kết nối nào?', 'Điều gì làm laptop bền?', 'Đề xuất thiết lập dock'],
  },
  creative: {
    label: 'Sáng tạo',
    icon: BrushIcon,
    prompts: [
      {
        text: 'Laptop cho chỉnh sửa video',
        description: 'Chọn GPU, RAM, lưu trữ và độ chính xác màu.',
        icon: BrushIcon,
      },
      {
        text: 'Laptop cho thiết kế đồ họa',
        description: 'Ưu tiên chất lượng màn hình và hiệu năng mượt mà.',
        icon: LaptopIcon,
      },
      {
        text: 'Cần bao nhiêu RAM cho chỉnh sửa 4K?',
        description: 'Lên kế hoạch bộ nhớ cho timeline, hiệu ứng và đa nhiệm.',
        icon: CpuIcon,
      },
      {
        text: 'Màn hình OLED hay IPS cho nhà sáng tạo?',
        description: 'So sánh màu sắc, độ tương phản, độ sáng và burn-in.',
        icon: BrushIcon,
      },
    ],
    followUps: [
      'OLED hay IPS cho chỉnh sửa?',
      'Tôi cần bao nhiêu VRAM?',
      'Chọn lưu trữ cho dự án video',
    ],
  },
  upgrade: {
    label: 'Nâng cấp',
    icon: CpuIcon,
    prompts: [],
    followUps: [
      'Tôi có thể nâng cấp RAM không?',
      'SSD nào tương thích?',
      'Nâng cấp có đáng giá không?',
    ],
  },
  troubleshooting: {
    label: 'Hỗ trợ',
    icon: WrenchIcon,
    prompts: [],
    followUps: [
      'Tại sao laptop của tôi quá nóng?',
      'Làm sao cải thiện tình trạng pin?',
      'Tại sao laptop của tôi chạy chậm?',
    ],
  },
} satisfies Record<
  LaptopTopic,
  {
    label: string;
    icon: typeof LaptopIcon;
    prompts: {
      text: string;
      description: string;
      icon: typeof LaptopIcon;
    }[];
    followUps: string[];
  }
>;

const welcomeTopics: LaptopTopic[] = [
  'general',
  'gaming',
  'programming',
  'study',
  'business',
  'creative',
];

const SUGGESTIONS_MARKER = '<!--SUGGESTIONS:';

const topicKeywords: Record<Exclude<LaptopTopic, 'general'>, string[]> = {
  gaming: ['gaming', 'game', 'fps', 'rtx', 'gpu', 'esport', 'chơi game', 'card đồ họa'],
  programming: [
    'programming',
    'developer',
    'coding',
    'docker',
    'virtual machine',
    'web development',
    'lập trình',
    'code',
  ],
  study: ['student', 'university', 'school', 'study', 'college', 'sinh viên', 'học tập'],
  business: ['business', 'office', 'meeting', 'travel', 'work laptop', 'doanh nghiệp', 'văn phòng'],
  creative: [
    'video editing',
    'graphic design',
    'photoshop',
    'premiere',
    'creator',
    'creative',
    'thiết kế',
    'dựng phim',
    'chỉnh sửa video',
  ],
  upgrade: [
    'upgrade',
    'ram upgrade',
    'ssd upgrade',
    'replace ram',
    'nâng cấp',
    'thay ram',
    'thay ssd',
  ],
  troubleshooting: [
    'overheat',
    'slow laptop',
    'not charging',
    'battery health',
    'blue screen',
    'repair',
    'lỗi',
    'nóng',
    'chậm',
    'không sạc',
    'sửa',
  ],
};

function getMessageText(parts: { type: string; text?: string }[]) {
  return parts
    .filter(
      (part): part is { type: 'text'; text: string } =>
        part.type === 'text' && typeof part.text === 'string',
    )
    .map((part) => part.text)
    .join('');
}

function getVisibleMessageText(text: string) {
  const markerIndex = text.indexOf(SUGGESTIONS_MARKER);
  return (markerIndex >= 0 ? text.slice(0, markerIndex) : text).trimEnd();
}

function getContextualSuggestions(text: string) {
  const match = text.match(/<!--SUGGESTIONS:(\[[\s\S]*?\])-->/);

  if (!match) return [];

  try {
    const suggestions = JSON.parse(match[1]);

    if (!Array.isArray(suggestions)) return [];

    return suggestions
      .filter(
        (suggestion): suggestion is string =>
          typeof suggestion === 'string' && suggestion.trim().length > 0 && suggestion.length <= 80,
      )
      .map((suggestion) => suggestion.trim())
      .slice(0, 3);
  } catch {
    return [];
  }
}

function detectTopic(text: string): LaptopTopic {
  const normalizedText = text.toLowerCase();
  let bestTopic: LaptopTopic = 'general';
  let bestScore = 0;

  for (const [topic, keywords] of Object.entries(topicKeywords) as [
    Exclude<LaptopTopic, 'general'>,
    string[],
  ][]) {
    const score = keywords.reduce(
      (total, keyword) => total + (normalizedText.includes(keyword) ? keyword.length : 0),
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

function AssistantAvatar() {
  return (
    <Avatar className="size-8 border-0 shadow-sm">
      <AvatarFallback className="bg-primary text-primary-foreground">
        <LaptopIcon className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" role="status">
      <AssistantAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-xs">
        {[0, 1, 2].map((index) => (
          <span
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            key={index}
            style={{ animationDelay: `${index * 140}ms` }}
          />
        ))}
        <span className="sr-only">Trợ lý Know đang suy nghĩ</span>
      </div>
    </div>
  );
}

export function LaptopChatbot({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [input, setInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<LaptopTopic>('general');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [visibilityKey, setVisibilityKey] = useState(0);
  const { clearError, error, messages, regenerate, sendMessage, setMessages, status, stop } =
    useChat({
      onError: (chatError) => {
        toast.error(chatError.message || 'Không thể kết nối đến trợ lý.');
      },
    });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setVisibilityKey((prev) => prev + 1);
          });
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isBusy = status === 'submitted' || status === 'streaming';
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');
  const conversationTopic = useMemo(() => {
    const recentUserText = messages
      .filter((message) => message.role === 'user')
      .slice(-3)
      .map((message) => getMessageText(message.parts))
      .reverse()
      .join(' ');

    return detectTopic(recentUserText);
  }, [messages]);
  const activeWelcomeSuggestions =
    topicSuggestions[selectedTopic].prompts.length > 0
      ? topicSuggestions[selectedTopic].prompts
      : topicSuggestions.general.prompts;
  const generatedFollowUps = lastAssistantMessage
    ? getContextualSuggestions(getMessageText(lastAssistantMessage.parts))
    : [];
  const activeFollowUps =
    generatedFollowUps.length > 0
      ? generatedFollowUps
      : topicSuggestions[conversationTopic].followUps;

  const submitMessage = (message: PromptInputMessage) => {
    const text = message.text.trim();

    if (!text || isBusy) return;

    clearError();
    sendMessage({ text });
    setInput('');
  };

  const submitSuggestion = (suggestion: string) => {
    if (isBusy) return;

    clearError();
    sendMessage({ text: suggestion });
  };

  const resetConversation = () => {
    stop();
    clearError();
    setMessages([]);
    setInput('');
    setSelectedTopic('general');
  };

  const copyMessage = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      window.setTimeout(() => setCopiedMessageId(null), 1_500);
    } catch {
      toast.error('Không thể sao chép phản hồi này.');
    }
  };

  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Mở trợ lý laptop"
          className="group fixed bottom-5 right-5 z-40 size-14 rounded-full shadow-xl shadow-primary/20 transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
          size="icon"
        >
          <BotIcon className="size-6 transition-transform group-hover:rotate-6" />
          <span className="absolute right-0 top-0 size-3 rounded-full border-2 border-background bg-emerald-500" />
        </Button>
      </SheetTrigger>

      <SheetContent
        className="w-full gap-0 overflow-hidden border-l bg-background p-0 sm:max-w-lg"
        side="right"
      >
        <SheetHeader className="border-b px-5 py-4 pr-14">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <LaptopIcon className="size-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate text-base font-semibold">
                    Trợ lý Know Laptop
                  </SheetTitle>
                  <Badge className="h-5 px-1.5 text-[10px]" variant="secondary">
                    AI
                  </Badge>
                </div>
                <SheetDescription className="mt-0.5 flex items-center gap-1.5 text-xs">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Trực tuyến | Chỉ về laptop
                </SheetDescription>
              </div>
            </div>

            {messages.length > 0 && (
              <Button
                aria-label="Bắt đầu trò chuyện mới"
                className="mr-1 shrink-0"
                onClick={resetConversation}
                size="icon-sm"
                variant="ghost"
              >
                <RotateCcwIcon />
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation className="min-h-0">
            <ConversationContent className="gap-6 px-5 py-6">
              {messages.length === 0 ? (
                <div className="flex min-h-full flex-col">
                  <div className="pb-7 pt-4">
                    <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <SparklesIcon className="size-6" />
                    </div>
                    <h2 className="max-w-sm text-2xl font-semibold tracking-tight">
                      Bạn đang tìm laptop gì?
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                      Chia sẻ ngân sách và nhu cầu sử dụng. Tôi sẽ giúp bạn thu hẹp các thông số
                      thực sự quan trọng.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {welcomeTopics.map((topic) => {
                        const config = topicSuggestions[topic];
                        const TopicIcon = config.icon;

                        return (
                          <button
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors',
                              selectedTopic === topic
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-muted',
                            )}
                            key={topic}
                            onClick={() => setSelectedTopic(topic)}
                            type="button"
                          >
                            <TopicIcon className="size-3" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Bắt đầu với một câu hỏi
                    </p>
                    {activeWelcomeSuggestions.map(({ text, description, icon: Icon }) => (
                      <button
                        className="group flex w-full items-center gap-3 rounded-2xl border bg-card/50 p-3.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/60"
                        disabled={isBusy}
                        key={text}
                        onClick={() => submitSuggestion(text)}
                        type="button"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{text}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {description}
                          </span>
                        </span>
                        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-muted/50 p-3.5 text-xs leading-5 text-muted-foreground">
                    <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>
                      Tôi chỉ trả lời câu hỏi về laptop. Xác nhận giá và tình trạng còn hàng trước
                      khi mua.
                    </span>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const rawText = getMessageText(message.parts);
                  const text = getVisibleMessageText(rawText);
                  const isAssistant = message.role === 'assistant';
                  const isLastAssistant = message.id === lastAssistantMessage?.id;

                  return (
                    <div
                      className={cn('flex items-end gap-2', !isAssistant && 'justify-end')}
                      key={isAssistant ? `${message.id}-v${visibilityKey}` : message.id}
                    >
                      {isAssistant && <AssistantAvatar />}
                      <Message
                        className={cn(
                          'max-w-[85%] gap-1',
                          isAssistant && 'max-w-[calc(100%-2.5rem)]',
                        )}
                        from={message.role}
                      >
                        <MessageContent
                          className={cn(
                            'rounded-2xl px-4 py-3 shadow-xs',
                            isAssistant
                              ? 'rounded-bl-md border bg-card'
                              : 'rounded-br-md bg-primary text-primary-foreground group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
                          )}
                        >
                          {message.parts.map((part, index) => {
                            if (part.type === 'text') {
                              return (
                                <MessageResponse
                                  className={cn(
                                    'text-sm leading-6',
                                    !isAssistant && '**:text-primary-foreground',
                                  )}
                                  key={`${message.id}-${index}`}
                                >
                                  {isAssistant ? getVisibleMessageText(part.text) : part.text}
                                </MessageResponse>
                              );
                            }

                            return null;
                          })}
                        </MessageContent>
                        {isAssistant && text && status !== 'streaming' && (
                          <MessageActions className="pl-1">
                            <MessageAction
                              label="Sao chép phản hồi"
                              onClick={() => copyMessage(message.id, text)}
                              tooltip={copiedMessageId === message.id ? 'Đã sao chép' : 'Sao chép'}
                            >
                              {copiedMessageId === message.id ? (
                                <CheckIcon className="size-3.5" />
                              ) : (
                                <CopyIcon className="size-3.5" />
                              )}
                            </MessageAction>
                            {isLastAssistant && (
                              <MessageAction
                                disabled={isBusy}
                                label="Tạo lại phản hồi"
                                onClick={() => regenerate({ messageId: message.id })}
                                tooltip="Tạo lại"
                              >
                                <RefreshCcwIcon className="size-3.5" />
                              </MessageAction>
                            )}
                          </MessageActions>
                        )}
                      </Message>
                    </div>
                  );
                })
              )}

              {status === 'submitted' && <TypingIndicator />}

              {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p className="font-medium text-destructive">Trợ lý không thể phản hồi</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kiểm tra kết nối và thử tạo lại phản hồi.
                  </p>
                  <Button
                    className="mt-3"
                    disabled={isBusy}
                    onClick={() => regenerate()}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCcwIcon />
                    Thử lại
                  </Button>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton className="bottom-4" />
          </Conversation>

          <div className="border-t bg-background p-4 shadow-[0_-10px_30px_-25px_hsl(0_0%_0%/0.15)]">
            {messages.length > 0 && !isBusy && (
              <Suggestions className="mb-3 max-w-[calc(100vw-2rem)]">
                {activeFollowUps.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    onClick={submitSuggestion}
                    size="sm"
                    suggestion={suggestion}
                  />
                ))}
              </Suggestions>
            )}

            <PromptInput className="rounded-2xl shadow-sm" onSubmit={submitMessage}>
              <PromptInputBody>
                <PromptInputTextarea
                  className="min-h-16 resize-none px-4 py-3"
                  disabled={isBusy}
                  maxLength={1_500}
                  onChange={(event) => setInput(event.currentTarget.value)}
                  placeholder="Hỏi tôi tìm hoặc so sánh laptop..."
                  value={input}
                />
              </PromptInputBody>
              <PromptInputFooter className="px-2 pb-2">
                <PromptInputTools>
                  <span className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                    <LaptopIcon className="size-3.5" />
                    Trợ lý chỉ về laptop | Enter để gửi
                  </span>
                </PromptInputTools>
                <PromptInputSubmit
                  className="rounded-xl"
                  disabled={!input.trim() && !isBusy}
                  onStop={stop}
                  status={status}
                />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              AI có thể mắc lỗi. Không bao giờ chia sẻ mật khẩu, OTP hoặc thông tin thanh toán.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
