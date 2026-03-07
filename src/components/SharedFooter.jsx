import React from 'react';
import { Link } from 'react-router-dom';
import './shared-footer.css';
import { DEFAULT_FOOTER_THEME, normalizeFooterTheme } from '../lib/footerTheme';

export default function SharedFooter({ theme = DEFAULT_FOOTER_THEME }) {
  const footerTheme = normalizeFooterTheme(theme);
  const footerStyle = {
    '--footer-bg': footerTheme.backgroundColor,
    '--footer-fg': footerTheme.foregroundColor,
    '--footer-border': footerTheme.borderColor,
  };

  return (
    <>
      <footer
        className="shared-footer"
        data-testid="shared-footer"
        data-footer-tone={footerTheme.tone}
        style={footerStyle}
      >
        <div className="shared-footer__content">
          <h5
            className="shared-footer__title shared-footer__title--desktop"
            data-testid="shared-footer-title"
          >
            &copy; 2022년 주식회사 웨비나스. 모든 저작권 소유.
          </h5>
          <h5 className="shared-footer__title shared-footer__title--mobile">
            &copy; 2022년 주식회사 웨비나스.
            <br />
            모든 저작권 소유.
          </h5>
          <div className="shared-footer__title-gap" />

          <div className="shared-footer__info">
            <h5 className="shared-footer__info-text">
              대표 박재오
              <br />
              07208 서울특별시 영등포구 선유로49길 23, 209호
            </h5>
            <h5 className="shared-footer__info-text">
              전화 02 6342 6834, 팩스 02 6342 6849, 이메일{' '}
              <a
                className="shared-footer__info-link"
                data-testid="shared-footer-email"
                href="mailto:sales@webinars.co.kr"
              >
                sales@webinars.co.kr
              </a>
            </h5>
          </div>
        </div>
      </footer>

      <div className="shared-footer__tel" data-testid="shared-footer-tel">
        <Link to="/contact/">
          <img decoding="async" src="/images/ui/tel.png" alt="Contact" />
        </Link>
      </div>
    </>
  );
}
