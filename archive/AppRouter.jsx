import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Services2Page from './components/services2.jsx';
import IndexPage from './components/index.jsx';
import AboutPage from './components/about.jsx';
import ReferencePage from './components/reference.jsx';
import ContactPage from './components/contact.jsx';
import WpAboutPage from './components/wp_about.jsx';
import WpServices2Page from './components/wp_services2.jsx';
import WpContactPage from './components/wp_contact.jsx';
import WpContactPage from './components/wp_contact.jsx';
import WebinarsCoKrContactPage from './components/webinars_co_kr_contact.jsx';
import IndexPage from './components/index.jsx';
import ContactPage from './components/contact.jsx';
import Wp2024Offline1028Page from './components/wp_2024_offline_1028.jsx';
import Wp2024Offline1010Page from './components/wp_2024_offline_1010.jsx';
import Wp2024Offline0927Page from './components/wp_2024_offline_0927.jsx';
import Wp2024Offline0904Page from './components/wp_2024_offline_0904.jsx';
import Wp2023Offline1201Page from './components/wp_2023_offline_1201.jsx';
import Wp2024Offline0705Page from './components/wp_2024_offline_0705.jsx';
import Wp2024OfflineRmaf0715Page from './components/wp_2024_offline_rmaf0715.jsx';
import Wp2024Offline3Page from './components/wp_2024_offline_3.jsx';
import Wp2024OfflineActs2024Page from './components/wp_2024_offline_acts2024.jsx';
import Wp2024Offline2Page from './components/wp_2024_offline_2.jsx';
import Wp2024Hybrid4Page from './components/wp_2024_hybrid_4.jsx';
import Wp2024Hybrid5Page from './components/wp_2024_hybrid_5.jsx';
import Wp2024Offline6Page from './components/wp_2024_offline_6.jsx';
import Wp2024Hybrid8Page from './components/wp_2024_hybrid_8.jsx';
import Wp2024Offline9Page from './components/wp_2024_offline_9.jsx';
import WpHybrid1Page from './components/wp_hybrid_1.jsx';
import WpHybrid2Page from './components/wp_hybrid_2.jsx';
import WpSolution4Page from './components/wp_solution_4.jsx';
import WpHybrid3Page from './components/wp_hybrid_3.jsx';
import WpHybrid5Page from './components/wp_hybrid_5.jsx';
import WpHybrid6Page from './components/wp_hybrid_6.jsx';
import WpHybrid8Page from './components/wp_hybrid_8.jsx';
import WpHybrid7Page from './components/wp_hybrid_7.jsx';
import WpHybrid9Page from './components/wp_hybrid_9.jsx';
import WpHybrid11Page from './components/wp_hybrid_11.jsx';
import WpHybrid12Page from './components/wp_hybrid_12.jsx';
import WpWebinarLiveStreaming13Page from './components/wp_webinar_live-streaming_13.jsx';
import WpWebinarLiveStreaming14Page from './components/wp_webinar_live-streaming_14.jsx';
import WpWebinarLiveStreaming15Page from './components/wp_webinar_live-streaming_15.jsx';
import 2024Offline1028Page from './components/2024_offline_1028.jsx';
import CategoryEbAfB8EbB684EbA598Page from './components/category__eb_af_b8-_eb_b6_84_eb_a5_98.jsx';
import 2024Offline0705Page from './components/2024_offline_0705.jsx';
import AuthorWebihomePage from './components/author_webihome.jsx';
import 2024Offline0904Page from './components/2024_offline_0904.jsx';
import 2023Offline1201Page from './components/2023_offline_1201.jsx';

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route path="/services2/" element={<Services2Page />} />
                <Route path="/" element={<IndexPage />} />
                <Route path="/about/" element={<AboutPage />} />
                <Route path="/reference/" element={<ReferencePage />} />
                <Route path="/contact/" element={<ContactPage />} />
                <Route path="/wp/about/" element={<WpAboutPage />} />
                <Route path="/wp/services2/" element={<WpServices2Page />} />
                <Route path="/wp/contact/" element={<WpContactPage />} />
                <Route path="/wp/contact" element={<WpContactPage />} />
                <Route path="/webinars.co.kr/contact" element={<WebinarsCoKrContactPage />} />
                <Route path="/" element={<IndexPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/wp/2024_offline_1028" element={<Wp2024Offline1028Page />} />
                <Route path="/wp/2024_offline_1010" element={<Wp2024Offline1010Page />} />
                <Route path="/wp/2024_offline_0927" element={<Wp2024Offline0927Page />} />
                <Route path="/wp/2024_offline_0904" element={<Wp2024Offline0904Page />} />
                <Route path="/wp/2023_offline_1201" element={<Wp2023Offline1201Page />} />
                <Route path="/wp/2024_offline_0705" element={<Wp2024Offline0705Page />} />
                <Route path="/wp/2024_offline_rmaf0715" element={<Wp2024OfflineRmaf0715Page />} />
                <Route path="/wp/2024_offline_3" element={<Wp2024Offline3Page />} />
                <Route path="/wp/2024_offline_acts2024" element={<Wp2024OfflineActs2024Page />} />
                <Route path="/wp/2024_offline_2" element={<Wp2024Offline2Page />} />
                <Route path="/wp/2024_hybrid_4" element={<Wp2024Hybrid4Page />} />
                <Route path="/wp/2024_hybrid_5" element={<Wp2024Hybrid5Page />} />
                <Route path="/wp/2024_offline_6" element={<Wp2024Offline6Page />} />
                <Route path="/wp/2024_hybrid_8" element={<Wp2024Hybrid8Page />} />
                <Route path="/wp/2024_offline_9" element={<Wp2024Offline9Page />} />
                <Route path="/wp/hybrid_1" element={<WpHybrid1Page />} />
                <Route path="/wp/hybrid_2" element={<WpHybrid2Page />} />
                <Route path="/wp/solution_4" element={<WpSolution4Page />} />
                <Route path="/wp/hybrid_3" element={<WpHybrid3Page />} />
                <Route path="/wp/hybrid_5" element={<WpHybrid5Page />} />
                <Route path="/wp/hybrid_6" element={<WpHybrid6Page />} />
                <Route path="/wp/hybrid_8" element={<WpHybrid8Page />} />
                <Route path="/wp/hybrid_7" element={<WpHybrid7Page />} />
                <Route path="/wp/hybrid_9" element={<WpHybrid9Page />} />
                <Route path="/wp/hybrid_11" element={<WpHybrid11Page />} />
                <Route path="/wp/hybrid_12" element={<WpHybrid12Page />} />
                <Route path="/wp/webinar_live-streaming_13" element={<WpWebinarLiveStreaming13Page />} />
                <Route path="/wp/webinar_live-streaming_14" element={<WpWebinarLiveStreaming14Page />} />
                <Route path="/wp/webinar_live-streaming_15" element={<WpWebinarLiveStreaming15Page />} />
                <Route path="/2024_offline_1028/" element={<2024Offline1028Page />} />
                <Route path="/category/%eb%af%b8-%eb%b6%84%eb%a5%98/" element={<CategoryEbAfB8EbB684EbA598Page />} />
                <Route path="/2024_offline_0705/" element={<2024Offline0705Page />} />
                <Route path="/author/webihome/" element={<AuthorWebihomePage />} />
                <Route path="/2024_offline_0904/" element={<2024Offline0904Page />} />
                <Route path="/2023_offline_1201/" element={<2023Offline1201Page />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;
