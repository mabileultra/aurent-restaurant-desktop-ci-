import { useAutoFitText } from '../hooks/useAutoFitText';

export default function AutoFitText({
  text,
  className = '',
  innerClassName = '',
  minRem = 0.8125,
  maxRem = 2.5,
  as: InnerTag = 'span',
}) {
  const { containerRef, textRef } = useAutoFitText(text, { minRem, maxRem });

  return (
    <span className={`auto-fit-text${className ? ` ${className}` : ''}`} ref={containerRef}>
      <InnerTag
        className={`auto-fit-text__inner${innerClassName ? ` ${innerClassName}` : ''}`}
        ref={textRef}
      >
        {text}
      </InnerTag>
    </span>
  );
}
