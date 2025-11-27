import React from 'react';

// Import images
import image1_3 from '../assets/images/image-1-3.jpg';
import image2_8 from '../assets/images/image-2-8.jpg';
import image3_1 from '../assets/images/image-3-1.jpg';
import image4_6 from '../assets/images/image-4-6.jpg';
import image5_5 from '../assets/images/image-5-5.jpg';

// Import existing page components
import Wp2024Offline1028Page from '../../archive/components/wp_2024_offline_1028.jsx';
import Wp2024OfflineRmaf0715Page from '../../archive/components/wp_2024_offline_rmaf0715.jsx';
import Webinar2024DesignPublication1Page from '../../archive/components/webinar_2024_design_publication_1.jsx';
import Wp2024Offline1010Page from '../../archive/components/wp_2024_offline_1010.jsx';
import Wp2024Offline0927Page from '../../archive/components/wp_2024_offline_0927.jsx';
import Wp2024Offline0904Page from '../../archive/components/wp_2024_offline_0904.jsx';
import Wp2023Offline1201Page from '../../archive/components/wp_2023_offline_1201.jsx';
import Wp2024Offline0705Page from '../../archive/components/wp_2024_offline_0705.jsx';
import Wp2024OfflineActs2024Page from '../../archive/components/wp_2024_offline_acts2024.jsx';
import Wp2024Offline2Page from '../../archive/components/wp_2024_offline_2.jsx';
import Wp2024Offline3Page from '../../archive/components/wp_2024_offline_3.jsx';
import Wp2024Hybrid4Page from '../../archive/components/wp_2024_hybrid_4.jsx';
import Wp2024Hybrid5Page from '../../archive/components/wp_2024_hybrid_5.jsx';
import Wp2024Offline6Page from '../../archive/components/wp_2024_offline_6.jsx';
import Webinar2024Offline7Page from '../../archive/components/webinar_2024_offline_7.jsx';
import Wp2024Hybrid8Page from '../../archive/components/wp_2024_hybrid_8.jsx';
import Wp2024Offline9Page from '../../archive/components/wp_2024_offline_9.jsx';
import WpHybrid1Page from '../../archive/components/wp_hybrid_1.jsx';
import WpHybrid2Page from '../../archive/components/wp_hybrid_2.jsx';
import WpHybrid3Page from '../../archive/components/wp_hybrid_3.jsx';
import WpSolution4Page from '../../archive/components/wp_solution_4.jsx';
import WpHybrid5Page from '../../archive/components/wp_hybrid_5.jsx';
import WpHybrid6Page from '../../archive/components/wp_hybrid_6.jsx';
import WpHybrid7Page from '../../archive/components/wp_hybrid_7.jsx';
import WpHybrid8Page from '../../archive/components/wp_hybrid_8.jsx';
import WpHybrid9Page from '../../archive/components/wp_hybrid_9.jsx';
import WebinarLiveStreaming10Page from '../../archive/components/webinar_live_streaming_10.jsx';
import WpHybrid11Page from '../../archive/components/wp_hybrid_11.jsx';
import WpHybrid12Page from '../../archive/components/wp_hybrid_12.jsx';
import WpWebinarLiveStreaming13Page from '../../archive/components/wp_webinar_live-streaming_13.jsx';
import WpWebinarLiveStreaming14Page from '../../archive/components/wp_webinar_live-streaming_14.jsx';
import WpWebinarLiveStreaming15Page from '../../archive/components/wp_webinar_live-streaming_15.jsx';

// RMAF 모달 콘텐츠 (원본 HTML 구조 그대로)
const rmafContent = () => (
  <div id="modal-ready">
    <h2 className="txt36">OFFLINE</h2>
    <h5 className="txt18 w700 mt20">
      2024 첨단재생의료 인재양성포럼<br />
      ―<br />
      재생의료진흥재단
    </h5>
    <h5 className="txt18 w700 re_1">&nbsp;장소</h5>
    <h5 className="txt18 w400 re_2">서울대한상공회의소 국제회의실</h5>
    <h5 className="txt18 w700 re_1">&nbsp;일자</h5>
    <h5 className="txt18 w400 re_2">2024년 7월 15일 (월)</h5>
    <h5 className="txt18 w700 re_1">&nbsp;주요내용</h5>
    <h5 className="txt18 w400 re_2">
      • 3개국 해외연사 항공, 수송, 숙식 개별 케어 및 의전<br />
      • 코어타겟 대상 홍보진행(뉴스레터, 온라인 초청장, 메일링 등)<br />
      • 홈페이지 제작 및 운영<br />
      • KEY VISUAL 및 현장조성물 제작<br />
      • 국내외 참가자 초청 및 관리<br />
      • 사전녹화 진행 및 영상 편집<br />
      • 테크투어 기획 및 운영<br /><br />

      <img
        fetchPriority="high"
        decoding="async"
        src={image1_3}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 1"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2632"
        style={{ maxWidth: '100%', height: 'auto' }}
      /><br />
      <img
        decoding="async"
        src={image2_8}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 2"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2633"
        style={{ maxWidth: '100%', height: 'auto' }}
      /><br />
      <img
        decoding="async"
        src={image3_1}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 3"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2634"
        style={{ maxWidth: '100%', height: 'auto' }}
      /><br />
      <img
        decoding="async"
        src={image4_6}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 4"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2635"
        style={{ maxWidth: '100%', height: 'auto' }}
      /><br />
      <img
        decoding="async"
        src={image5_5}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 5"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2636"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </h5>
  </div>
);

// 간단한 디폴트 콘텐츠
const defaultContent = () => (
  <div id="modal-ready">
    <h2 className="txt36">이벤트 정보</h2>
    <h5 className="txt18 w700 mt20">
      상세 정보를 준비 중입니다.
    </h5>
  </div>
);

// RMAF 0715 모달 콘텐츠 (React import 이미지 사용)
const rmaf0715Content = () => (
  <div id="modal-ready">
    <h2 className="txt36">OFFLINE</h2>
    <h5 className="txt18 w700 mt20">
      2024 첨단재생의료 인재양성포럼<br />
      ―<br />
      재생의료진흥재단
    </h5>
    <h5 className="txt18 w700 re_1">&nbsp;장소</h5>
    <h5 className="txt18 w400 re_2">서울대한상공회의소 국제회의실</h5>
    <h5 className="txt18 w700 re_1">&nbsp;일자</h5>
    <h5 className="txt18 w400 re_2">2024년 7월 15일 (월)</h5>
    <h5 className="txt18 w700 re_1">&nbsp;주요내용</h5>
    <h5 className="txt18 w400 re_2">
      • 3개국 해외연사 항공, 수송, 숙식 개별 케어 및 의전<br />
      • 코어타겟 대상 홍보진행(뉴스레터, 온라인 초청장, 메일링 등)<br />
      • 홈페이지 제작 및 운영<br />
      • KEY VISUAL 및 현장조성물 제작<br />
      • 국내외 참가자 초청 및 관리<br />
      • 사전녹화 진행 및 영상 편집<br />
      • 테크투어 기획 및 운영<br /><br />

      <img
        fetchPriority="high"
        decoding="async"
        src={image1_3}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 1"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2599"
        style={{ maxWidth: '100%', height: 'auto' }}
      /><br />
      <img
        decoding="async"
        src={image2_8}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 2"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2598"
        style={{ maxWidth: '100%', height: 'auto' }}
      /><br />
      <img
        decoding="async"
        src={image3_1}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 3"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2520"
        style={{ maxWidth: '100%', height: 'auto' }}
      /><br />
      <img
        decoding="async"
        src={image4_6}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 4"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2635"
        style={{ maxWidth: '100%', height: 'auto' }}
      /><br />
      <img
        decoding="async"
        src={image5_5}
        alt="2024 첨단재생의료 인재양성포럼 - 이미지 5"
        width="1920"
        height="1280"
        className="alignnone size-full wp-image-2636"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </h5>
  </div>
);

// 모달 콘텐츠 매핑
const modalContents = {
  '/2024_offline_1028/': Wp2024Offline1028Page,
  '/2024_offline_rmaf0715/': Wp2024OfflineRmaf0715Page,
  '/WEBINAR/2024_design_publication_1/': Webinar2024DesignPublication1Page,
  '/2024_offline_1010/': Wp2024Offline1010Page,
  '/2024_offline_0927/': Wp2024Offline0927Page,
  '/2024_offline_0904/': Wp2024Offline0904Page,
  '/2023_offline_1201/': Wp2023Offline1201Page,
  '/2024_offline_0705/': Wp2024Offline0705Page,
  '/2024_offline_acts2024/': Wp2024OfflineActs2024Page,
  '/2024_offline_2/': Wp2024Offline2Page,
  '/2024_offline_3/': Wp2024Offline3Page,
  '/2024_hybrid_4/': Wp2024Hybrid4Page,
  '/2024_hybrid_5/': Wp2024Hybrid5Page,
  '/2024_offline_6/': Wp2024Offline6Page,
  '/WEBINAR/2024_offline_7/': Webinar2024Offline7Page,
  '/2024_hybrid_8/': Wp2024Hybrid8Page,
  '/2024_offline_9/': Wp2024Offline9Page,
  '/hybrid_1/': WpHybrid1Page,
  '/hybrid_2/': WpHybrid2Page,
  '/hybrid_3/': WpHybrid3Page,
  '/solution_4/': WpSolution4Page,
  '/hybrid_5/': WpHybrid5Page,
  '/hybrid_6/': WpHybrid6Page,
  '/hybrid_7/': WpHybrid7Page,
  '/hybrid_8/': WpHybrid8Page,
  '/hybrid_9/': WpHybrid9Page,
  '/WEBINAR/webinar_live-streaming_10/': WebinarLiveStreaming10Page,
  '/hybrid_11/': WpHybrid11Page,
  '/hybrid_12/': WpHybrid12Page,
  '/webinar_live-streaming_13/': WpWebinarLiveStreaming13Page,
  '/webinar_live-streaming_14/': WpWebinarLiveStreaming14Page,
  '/webinar_live-streaming_15/': WpWebinarLiveStreaming15Page,
};

const ModalContent = ({ path }) => {
  console.log('[ModalContent] Received path:', path);
  console.log('[ModalContent] Available paths:', Object.keys(modalContents));
  const ContentComponent = modalContents[path] || defaultContent;
  console.log('[ModalContent] Selected component:', ContentComponent.name || ContentComponent);

  return (
    <>
      {/* 원본 CSS 스타일 추가 + 모달 내 헤더/푸터 숨기기 */}
      <style>{`
        .txt36 { font-size: 36px; }
        .txt18 { font-size: 18px !important; }
        .w700 { font-weight: 700 !important; }
        .w400 { font-weight: 400 !important; }
        .mt20 { margin-top: 20px; }
        .re_1 { margin-bottom: 5px; }
        .re_2 { margin-bottom: 15px; }

        #modal-ready {
          padding: 0;
          background: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        #modal-ready h2 {
          margin: 0 0 20px 0;
          color: #333;
        }

        #modal-ready h5 {
          margin: 0;
          color: #333;
          line-height: 1.5;
        }

        #modal-ready img {
          max-width: 100%;
          height: auto;
          margin: 10px 0;
        }

        /* 모달 내 헤더/푸터/불필요한 요소 숨기기 */
        .modal-content #header-outer,
        .modal-content #header-space,
        .modal-content header#top,
        .modal-content #search-outer,
        .modal-content .nectar-skip-to-content,
        .modal-content #ajax-loading-screen,
        .modal-content .bg-color-stripe,
        .modal-content .heading-title,
        .modal-content #breadcrumbs,
        .modal-content #sidebar,
        .modal-content #author-bio,
        .modal-content .blog_next_prev_buttons,
        .modal-content .related-post-wrap,
        .modal-content #footer-outer,
        .modal-content footer,
        .modal-content .nectar-mobile-only,
        .modal-content .slide-out-widget-area-toggle,
        .modal-content nav,
        .modal-content .page-container > h1,
        .modal-content .nectar-social,
        .modal-content .social-sharing-alignment-default,
        .modal-content .nectar-social-sharing-column,
        .modal-content [class*="social-sharing"],
        .modal-content [class*="nectar-social"],
        .modal-content .meta-category,
        .modal-content .related-posts,
        .modal-content .blog-recent {
          display: none !important;
        }

        /* 모달 내 컨텐츠 영역 전체 폭으로 */
        .modal-content .post-area {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
        }

        .modal-content .container-wrap,
        .modal-content .container.main-content,
        .modal-content .row {
          padding: 0 !important;
          margin: 0 !important;
        }

        .modal-content article {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* 모달 콘텐츠 일관된 레이아웃 */
        .modal-content .content-inner,
        .modal-content .post-content {
          padding: 0 !important;
        }

        .modal-content .content-inner > *:first-child,
        .modal-content .post-content > *:first-child {
          margin-top: 0;
        }

      `}</style>

      <div
        className="modal-content"
        style={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'white',
          minHeight: '400px',
          padding: '40px'
        }}>
        {/* Prevent nested modals by intercepting modal events */}
        <div onClick={(e) => e.stopPropagation()}>
          <ContentComponent />
        </div>
      </div>
    </>
  );
};

export default ModalContent;