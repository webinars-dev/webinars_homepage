import React, { useEffect } from 'react';
import PageRenderer from '../../src/components/PageRenderer';
import pageHtml from '../pages/contact.html?raw';

const RECAPTCHA_SCRIPT_ID = 'salesforce-webtolead-recaptcha';

const ContactPage = () => {
  useEffect(() => {
    const form = document.getElementById('salesforce-contact-form');
    if (!form) return undefined;

    const ensureRecaptchaScript = () => {
      const recaptchaContainer = form.querySelector('.g-recaptcha');
      if (!recaptchaContainer) return;

      // If grecaptcha is already loaded, render the widget directly
      if (window.grecaptcha && window.grecaptcha.render) {
        // Check if reCAPTCHA is already rendered in this container
        if (!recaptchaContainer.querySelector('iframe')) {
          try {
            window.grecaptcha.render(recaptchaContainer, {
              sitekey: recaptchaContainer.getAttribute('data-sitekey'),
            });
          } catch (e) {
            // reCAPTCHA may already be rendered, ignore error
            console.debug('[Contact] reCAPTCHA render skipped:', e.message);
          }
        }
        return;
      }

      // If script is not loaded yet, load it
      if (document.getElementById(RECAPTCHA_SCRIPT_ID)) return;
      const script = document.createElement('script');
      script.id = RECAPTCHA_SCRIPT_ID;
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    const setError = (key, message) => {
      const errorEl = form.querySelector(`[data-error-for="${key}"]`);
      const wrapper = form.querySelector(`[data-field="${key}"]`);
      if (errorEl) errorEl.textContent = message ?? '';
      if (wrapper) wrapper.classList.toggle('quform-has-error', Boolean(message));
    };

    const clearErrors = () => {
      form.querySelectorAll('.contact-form-error').forEach((node) => {
        // eslint-disable-next-line no-param-reassign
        node.textContent = '';
      });
      form.querySelectorAll('.quform-has-error').forEach((node) => {
        node.classList.remove('quform-has-error');
      });
    };

    let captchaTimestampWarned = false;
    const updateCaptchaTimestamp = () => {
      const settingsInput = form.querySelector('input[name="captcha_settings"]');
      if (!settingsInput) return;
      try {
        const settings = JSON.parse(settingsInput.value);
        settings.ts = `${Date.now()}`;
        settingsInput.value = JSON.stringify(settings);
      } catch (error) {
        if (!captchaTimestampWarned) {
          console.warn('[Contact] Failed to update captcha_settings timestamp', error);
          captchaTimestampWarned = true;
        }
      }
    };

    const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const validatePhone = (value) => /^[0-9+\-()\s]{7,}$/.test(value);
    const statusEl = document.getElementById('salesforce-form-status');
    const loader = form.querySelector('.quform-loading');

    const handleSubmit = (event) => {
      event.preventDefault();
      clearErrors();
      if (statusEl) statusEl.textContent = '';
      if (loader) loader.style.display = 'none';

      const honeypot = form.querySelector('input[name="hp_contact"]');
      if (honeypot?.value?.trim()) {
        return;
      }

      let hasError = false;
      const projectTypeInput = Array.from(form.querySelectorAll('input[name="00NTJ00000JV6e7"]')).find(
        (input) => input.checked
      );
      const projectTypeValue = projectTypeInput ? projectTypeInput.value.replace('/ ', '/') : '';
      if (!projectTypeValue) {
        setError('projectType', '프로젝트 유형을 선택해 주세요.');
        hasError = true;
      } else if (projectTypeInput && projectTypeInput.value !== projectTypeValue) {
        projectTypeInput.value = projectTypeValue;
      }

      const lastName = form.querySelector('input[name="last_name"]');
      const company = form.querySelector('input[name="company"]');
      const email = form.querySelector('input[name="email"]');
      const phone = form.querySelector('input[name="phone"]');
      const description = form.querySelector('textarea[name="Enquiry__c"]');

      if (!lastName || lastName.value.trim().length < 2) {
        setError('last_name', '성함을 2자 이상 입력해 주세요.');
        hasError = true;
      }

      if (!company || company.value.trim().length < 2) {
        setError('company', '소속을 2자 이상 입력해 주세요.');
        hasError = true;
      }

      if (!email || !validateEmail(email.value.trim())) {
        setError('email', '올바른 이메일 형식을 입력해 주세요.');
        hasError = true;
      }

      if (!phone || !validatePhone(phone.value.trim())) {
        setError('phone', '숫자, 괄호, 하이픈만 포함한 연락처를 입력해 주세요.');
        hasError = true;
      }

      if (!description || description.value.trim().length < 10) {
        setError('description', '문의사항을 10자 이상 입력해 주세요.');
        hasError = true;
      }

      const recaptchaResponse = document.getElementById('g-recaptcha-response');
      if (!recaptchaResponse || !recaptchaResponse.value.trim()) {
        setError('recaptcha', '스팸 방지를 위해 reCAPTCHA 인증을 완료해 주세요.');
        hasError = true;
      }

      if (hasError) {
        if (statusEl) statusEl.textContent = '필수 입력값을 확인해 주세요.';
        return;
      }

      if (statusEl) statusEl.textContent = '보내는 중...';
      if (loader) loader.style.display = 'block';
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
      }
      form.submit();
    };

    ensureRecaptchaScript();
    const tsInterval = window.setInterval(updateCaptchaTimestamp, 500);
    updateCaptchaTimestamp();
    form.addEventListener('submit', handleSubmit);

    return () => {
      form.removeEventListener('submit', handleSubmit);
      window.clearInterval(tsInterval);
    };
  }, []);

  return <PageRenderer html={pageHtml} />;
};

export default ContactPage;
