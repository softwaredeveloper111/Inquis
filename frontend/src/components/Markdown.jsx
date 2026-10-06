import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { MediaImage } from "../features/chat/components/MediaImage/MediaImage"; 
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

const components = {
  img: ({ src, alt }) => <MediaImage src={src} alt={alt} />,
};

export default function Markdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}