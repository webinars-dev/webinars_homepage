import React from 'react';
import PageRenderer from '../../src/components/PageRenderer';
import img1_1_2024 from '../../src/assets/images/img1_1_2024.png';
import img1_2_2024 from '../../src/assets/images/img1_2_2024.png';
import img1_3_2024 from '../../src/assets/images/img1_3_2024.png';

const html = `
<div class="page-container">
    <div class="content-wrap">
        <h2 class="txt36">DESIGN / PUBLICATION</h2>
        <h5 class="txt18 w700 mt20">2024 강원 동계청소년올림픽<br />
        ―<br />
        IOC / 강원동계청소년올림픽 조직위원회</h5>

        <h5 class="txt18 w700 re_1">장소</h5>
        <h5 class="txt18 w400 re_2">강릉, 평창, 정선, 횡성</h5>

        <h5 class="txt18 w700 re_1">일자</h5>
        <h5 class="txt18 w400 re_2">2024년 1월 ~ 2024년 6월</h5>

        <h5 class="txt18 w700 re_1">주요내용</h5>
        <h5 class="txt18 w400 re_2">• 올림픽기간내 취재 및 촬영<br />
        • 각 기관 올림픽 자료 취합<br />
        • IOC 공식보고서 제작</h5>

        <div class="mt30"><img class="alignnone size-full" src="${img1_1_2024}" alt="2024 강원 동계청소년올림픽 이미지 1" width="920" height="613" /></div>
        <div class="mt30"><img class="alignnone size-full" src="${img1_2_2024}" alt="2024 강원 동계청소년올림픽 이미지 2" width="920" height="613" /></div>
        <div class="mt30"><img class="alignnone size-full" src="${img1_3_2024}" alt="2024 강원 동계청소년올림픽 이미지 3" width="920" height="638" /></div>
    </div>
</div>
`;

const Webinar2024DesignPublication1Page = () => {
    return <PageRenderer html={html} />;
};

export default Webinar2024DesignPublication1Page;