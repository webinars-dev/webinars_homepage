import React, { useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// 커스텀 헤딩 클래스 등록
const Block = Quill.import('blots/block');

const normalizeLegacyModalHtml = (html) => {
  if (typeof html !== 'string') return html;
  if (!html.trim()) return html;

  // legacy 클래스가 없으면 빠르게 반환
  if (!/modal-(title|subtitle|section-title)/i.test(html)) return html;
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('h2.modal-title').forEach((node) => {
      node.className = 'txt36';
    });

    doc.querySelectorAll('h5.modal-subtitle').forEach((node) => {
      node.className = 'txt18 w700 mt20';
    });

    doc.querySelectorAll('h5.modal-section-title').forEach((node) => {
      node.className = 'txt18 w700 re_1';
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

// H1: 대제목 (OFFLINE 등)
class Heading1 extends Block {
  static blotName = 'heading1';
  static tagName = 'H2';
  static className = 'txt36';
}

// H2: 부제목/본문 텍스트
class Heading2 extends Block {
  static blotName = 'heading2';
  static tagName = 'H5';
  // heading2/heading3는 같은 tagName(H5)이므로 구분 가능한 className을 지정
  static className = 'mt20';

  static create(value) {
    const node = super.create(value);
    node.setAttribute('class', 'txt18 w700 mt20');
    return node;
  }
}

// H3: 섹션 제목 (장소, 일자, 주요내용 - 왼쪽 보더 있음)
class Heading3 extends Block {
  static blotName = 'heading3';
  static tagName = 'H5';
  static className = 're_1';

  static create(value) {
    const node = super.create(value);
    node.setAttribute('class', 'txt18 w700 re_1');
    return node;
  }
}

Quill.register(Heading1, true);
Quill.register(Heading2, true);
Quill.register(Heading3, true);

/**
 * 리치 텍스트 에디터 (이미지 업로드 지원)
 */
export function RichTextEditor({ value, onChange, onImageUpload, placeholder, className }) {
  const quillRef = useRef(null);
  const normalizedValue = useMemo(() => normalizeLegacyModalHtml(value || ''), [value]);

  const toggleHeading = (formatName) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    if (!range) return;

    const current = editor.getFormat(range);
    const isActive = !!current?.[formatName];
    const headingFormats = ['heading1', 'heading2', 'heading3'];

    if (isActive) {
      editor.formatLine(range.index, range.length, formatName, false);
      return;
    }

    headingFormats.forEach((name) => editor.formatLine(range.index, range.length, name, false));
    editor.formatLine(range.index, range.length, formatName, true);
  };

  // 이미지 핸들러
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg,image/png,image/webp,image/gif');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        // 업로드 콜백 호출
        if (onImageUpload) {
          const url = await onImageUpload(file);
          if (url && quillRef.current) {
            const editor = quillRef.current.getEditor();
            const range = editor.getSelection(true);
            editor.insertEmbed(range.index, 'image', url);
            editor.setSelection(range.index + 1);
          }
        }
      } catch (err) {
        alert('이미지 업로드 실패: ' + (err?.message || '알 수 없는 오류'));
      }
    };
  };

  // 커스텀 헤딩 핸들러
  const heading1Handler = () => {
    toggleHeading('heading1');
  };

  const heading2Handler = () => {
    toggleHeading('heading2');
  };

  const heading3Handler = () => {
    toggleHeading('heading3');
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: '#toolbar',
        handlers: {
          image: imageHandler,
          heading1: heading1Handler,
          heading2: heading2Handler,
          heading3: heading3Handler,
        },
      },
    }),
    [onImageUpload]
  );

  const formats = [
    'heading1',
    'heading2',
    'heading3',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align',
    'link',
    'image',
  ];

  return (
    <div className={className}>
      {/* 커스텀 툴바 */}
      <div id="toolbar" className="ql-toolbar ql-snow">
        <span className="ql-formats">
          <button className="ql-heading1" title="제목 (H1 - txt36)">
            <strong>H1</strong>
          </button>
          <button className="ql-heading2" title="부제목 (H2 - txt18)">
            <strong>H2</strong>
          </button>
          <button className="ql-heading3" title="섹션 (H3 - 장소 등)">
            <strong>H3</strong>
          </button>
        </span>
        <span className="ql-formats">
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
        </span>
        <span className="ql-formats">
          <select className="ql-color" />
          <select className="ql-background" />
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
        </span>
        <span className="ql-formats">
          <select className="ql-align" />
        </span>
        <span className="ql-formats">
          <button className="ql-link" />
          <button className="ql-image" />
        </span>
        <span className="ql-formats">
          <button className="ql-clean" />
        </span>
      </div>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={normalizedValue}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style>{`
        .ql-container {
          min-height: 200px;
          font-size: 14px;
          background: #ffffff;
        }
        .ql-editor {
          min-height: 200px;
          color: #1f2937;
        }
        .ql-toolbar.ql-snow {
          border: 1px solid #e5e7eb;
          border-radius: 0;
          background: #f9fafb;
        }
        .ql-container.ql-snow {
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0;
        }
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .ql-snow .ql-stroke {
          stroke: #374151 !important;
        }
        .ql-snow .ql-fill {
          fill: #374151 !important;
        }
        .ql-snow .ql-picker {
          color: #374151 !important;
        }
        .ql-snow .ql-picker-label {
          color: #374151 !important;
        }
        .ql-snow .ql-picker-options {
          background: #ffffff;
          border-color: #e5e7eb;
        }
        .ql-snow .ql-picker-item:hover {
          color: #2563eb;
        }
        .ql-snow button:hover .ql-stroke {
          stroke: #2563eb !important;
        }
        .ql-snow button:hover .ql-fill {
          fill: #2563eb !important;
        }
        .ql-snow button.ql-active .ql-stroke {
          stroke: #2563eb !important;
        }
        .ql-snow button.ql-active .ql-fill {
          fill: #2563eb !important;
        }
        .ql-editor img {
          max-width: 100%;
          height: auto;
        }
        /* 커스텀 헤딩 버튼 스타일 */
        .ql-heading1,
        .ql-heading2,
        .ql-heading3 {
          width: auto !important;
          padding: 0 8px !important;
          font-size: 12px !important;
        }
        .ql-heading1 strong,
        .ql-heading2 strong,
        .ql-heading3 strong {
          color: #374151;
        }
        .ql-heading1:hover strong,
        .ql-heading2:hover strong,
        .ql-heading3:hover strong {
          color: #2563eb;
        }
        /* 에디터 내 헤딩 미리보기 스타일 */
        .ql-editor h2.txt36 {
          font-size: 28px;
          font-weight: 700;
          font-family: 'hyphen', 'Noto Sans KR', sans-serif;
          text-transform: uppercase;
          color: #1f2937;
          margin: 0 0 16px 0;
        }
        .ql-editor h5.mt20 {
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }
        .ql-editor h5.re_1 {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin: 20px 0 5px 0;
        }
        .ql-editor h5.re_1::before {
          content: '';
          width: 4px;
          height: 14px;
          display: inline-block;
          background: #374151;
          vertical-align: middle;
          margin-right: 10px;
        }
      `}</style>
    </div>
  );
}

export default RichTextEditor;
