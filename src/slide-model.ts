import type { SceneSlideLike, TextValueLike } from "./scene-runtime-types";

const LONG_DESCRIPTION_THRESHOLD = 220;
const LONG_DESCRIPTION_SENTENCE_COUNT = 2;
const SHORT_DESCRIPTION_SENTENCE_COUNT = 1;

export interface SlideModel {
  description: string;
  extraParagraphs: string[];
  fullText: string;
  id: string;
  introParagraph: string;
  slide: SceneSlideLike;
  title: string;
  viewpoint: unknown;
}

function readText(value: TextValueLike): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value.text === "string") {
    return value.text.trim();
  }

  return "";
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);

  return matches?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

function buildIntroText(description: string): string {
  const sentences = splitSentences(description);

  if (sentences.length === 0) {
    return "";
  }

  const sentenceCount =
    description.length >= LONG_DESCRIPTION_THRESHOLD
      ? LONG_DESCRIPTION_SENTENCE_COUNT
      : SHORT_DESCRIPTION_SENTENCE_COUNT;

  return sentences.slice(0, sentenceCount).join(" ");
}

function splitSourceParagraphs(description: string): string[] {
  return description
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function groupSentencesIntoParagraphs(sentences: string[]): string[] {
  if (sentences.length === 0) {
    return [];
  }

  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  sentences.forEach((sentence, index) => {
    currentParagraph.push(sentence);

    const isLastSentence = index === sentences.length - 1;
    const nextSentence = sentences[index + 1] ?? "";
    const shouldBreak =
      currentParagraph.length >= 2 &&
      (sentence.length >= 120 || nextSentence.length >= 140 || isLastSentence);

    if (shouldBreak || currentParagraph.length >= 3 || isLastSentence) {
      paragraphs.push(currentParagraph.join(" "));
      currentParagraph = [];
    }
  });

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  return paragraphs;
}

function buildTextParagraphs(description: string): {
  extraParagraphs: string[];
  introParagraph: string;
} {
  const introParagraph = buildIntroText(description);

  if (!description) {
    return {
      extraParagraphs: [],
      introParagraph: "",
    };
  }

  const sourceParagraphs = splitSourceParagraphs(description);

  if (sourceParagraphs.length > 1) {
    const [firstParagraph, ...remainingParagraphs] = sourceParagraphs;

    if (firstParagraph.startsWith(introParagraph)) {
      const firstParagraphRemainder = firstParagraph.slice(introParagraph.length).trim();

      return {
        extraParagraphs: [firstParagraphRemainder, ...remainingParagraphs].filter(Boolean),
        introParagraph,
      };
    }

    return {
      extraParagraphs: sourceParagraphs.filter((paragraph) => paragraph !== introParagraph),
      introParagraph,
    };
  }

  const sentences = splitSentences(description);
  const introSentenceCount = splitSentences(introParagraph).length;

  return {
    extraParagraphs: groupSentencesIntoParagraphs(sentences.slice(introSentenceCount)),
    introParagraph,
  };
}

export function buildSlideModel(slide: SceneSlideLike, index: number): SlideModel {
  const title = readText(slide.title) || `Stop ${index + 1}`;
  const description = readText(slide.description);
  const { introParagraph, extraParagraphs } = buildTextParagraphs(description);

  return {
    description,
    extraParagraphs,
    fullText: description,
    id: slide.id || `slide-${index + 1}`,
    introParagraph,
    slide,
    title,
    viewpoint: slide.viewpoint ?? null,
  };
}