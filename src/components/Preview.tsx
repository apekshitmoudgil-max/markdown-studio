"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

type Props = {
  source: string;
  fluid?: boolean;
};

export function Preview({ source, fluid }: Props) {
  return (
    <div className="h-full overflow-auto bg-white">
      <div className={`markdown-body px-8 py-8 ${fluid ? "max-w-none" : ""}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
        >
          {source}
        </ReactMarkdown>
      </div>
    </div>
  );
}
