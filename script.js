"use strict";

(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    const playHeroVideo = () => {
      const playback = heroVideo.play();
      if (playback) {
        playback.catch(error => {
          if (error.name !== "AbortError") {
            console.error("Não foi possível reproduzir o vídeo de fundo.", error);
          }
        });
      }
    };
    const applyMotionPreference = () => {
      if (prefersReducedMotion.matches) {
        heroVideo.pause();
        heroVideo.removeAttribute("autoplay");
      } else {
        heroVideo.defaultPlaybackRate = 0.5;
        heroVideo.playbackRate = 0.5;
        heroVideo.setAttribute("autoplay", "");
        if (heroVideo.paused) playHeroVideo();
      }
    };

    prefersReducedMotion.addEventListener("change", applyMotionPreference);
    applyMotionPreference();
  }

  const revealGroups = [
    ".assurance-inner > span:not(.assurance-caption)",
    ".service-card",
    ".technology-intro, .technology-item",
    ".process-grid > li",
    "#reviews-prompt",
    ".contact-copy, .inquiry-form",
    ".faq-section > div, .faq-item",
    ".footer-main > *, .footer-bottom > *",
  ];
  const companiesViewport = document.querySelector(".companies-viewport");
  if (companiesViewport) {
    const companiesTrack = companiesViewport.querySelector(".companies-track");
    const companiesGroup = companiesTrack?.querySelector(".companies-group");
    let drag = null;

    if (companiesTrack && companiesGroup) {
      const getOffset = () => new DOMMatrixReadOnly(
        companiesTrack.style.transform || getComputedStyle(companiesTrack).transform,
      ).m41;
      const getGroupWidth = () => companiesGroup.getBoundingClientRect().width;
      const wrapOffset = (offset, width = getGroupWidth()) => (
        width ? -(((-offset % width) + width) % width) : 0
      );
      const getAnimationDuration = () => {
        const durationValue = getComputedStyle(companiesTrack).animationDuration;
        return parseFloat(durationValue) * (durationValue.endsWith("ms") ? 1 : 1000);
      };
      const setOffset = (offset, animate, duration = getAnimationDuration()) => {
        const width = getGroupWidth();
        const wrappedOffset = wrapOffset(offset, width);
        if (!animate || !width) {
          companiesTrack.style.transform = `translateX(${wrappedOffset}px)`;
          companiesViewport.classList.remove("is-dragging");
          return;
        }

        const phase = (-wrappedOffset / width) * duration;
        companiesTrack.style.setProperty("--companies-marquee-delay", `-${phase}ms`);
        companiesTrack.style.removeProperty("transform");
        companiesViewport.classList.remove("is-dragging");
        const marqueeAnimation = companiesTrack.getAnimations()
          .find(animation => animation.animationName === "companies-marquee");
        if (marqueeAnimation) marqueeAnimation.currentTime = 0;
      };

      companiesViewport.addEventListener("pointerdown", event => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        const animate = !prefersReducedMotion.matches && companiesTrack
          .getAnimations()
          .some(animation => animation.animationName === "companies-marquee");
        drag = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startOffset: getOffset(),
          groupWidth: getGroupWidth(),
          animationDuration: getAnimationDuration(),
          animate,
          isDragging: false,
        };
        companiesViewport.setPointerCapture(event.pointerId);
        companiesViewport.classList.add("is-dragging");
      });

      companiesViewport.addEventListener("pointermove", event => {
        if (!drag || drag.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - drag.startX;
        const deltaY = event.clientY - drag.startY;
        if (!drag.isDragging && Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY)) {
          drag.isDragging = true;
          companiesViewport.classList.add("is-dragging");
        }
        if (!drag.isDragging) return;

        event.preventDefault();
        const offset = wrapOffset(drag.startOffset + deltaX, drag.groupWidth);
        companiesTrack.style.transform = `translateX(${offset}px)`;
      });

      const finishDrag = event => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        const completedDrag = drag;
        drag = null;
        const offset = completedDrag.isDragging ? getOffset() : completedDrag.startOffset;
        setOffset(
          offset,
          completedDrag.animate && !prefersReducedMotion.matches,
          completedDrag.animationDuration,
        );
      };

      companiesViewport.addEventListener("pointerup", finishDrag);
      companiesViewport.addEventListener("pointercancel", finishDrag);

      companiesViewport.addEventListener("keydown", event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();

        const width = getGroupWidth();
        const item = companiesGroup.querySelector(".company-logo");
        const gap = parseFloat(getComputedStyle(companiesGroup).gap) || 0;
        const step = (item?.getBoundingClientRect().width || 176) + gap;
        const direction = event.key === "ArrowRight" ? -1 : 1;
        const animate = !prefersReducedMotion.matches && companiesTrack
          .getAnimations()
          .some(animation => animation.animationName === "companies-marquee");
        setOffset(getOffset() + direction * step, animate && width > 0);
      });
    }
  }

  if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const revealTargets = [...new Set(
      revealGroups.flatMap(selector => [...document.querySelectorAll(selector)]),
    )];

    revealTargets.forEach(element => {
      element.dataset.scrollReveal = "";
    });
    document.documentElement.classList.add("has-scroll-reveal");

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    revealTargets.forEach(element => revealObserver.observe(element));
  }

  // Telefone internacional: somente números, sem espaços ou pontuação.
  const phone = "5516992954703";
  const defaultMessage = "Oi, JP! Gostaria de pedir um orçamento.";
  const whatsappUrl = message => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  document.querySelectorAll("[data-whatsapp]").forEach(link => {
    const service = link.dataset.whatsapp;
    link.href = whatsappUrl(service ? `Olá, JP! Gostaria de solicitar um orçamento para ${service}.` : defaultMessage);
  });

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    const menuToggle = siteHeader.querySelector(".mobile-nav-toggle");
    const mobileMenu = siteHeader.querySelector(".jp-navbar");

    if (menuToggle && mobileMenu) {
      menuToggle.hidden = false;
      siteHeader.classList.add("has-mobile-menu");

      const setMenuOpen = isOpen => {
        siteHeader.classList.toggle("is-menu-open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
          "aria-label",
          isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação",
        );
      };

      menuToggle.addEventListener("click", () => {
        setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
      });

      mobileMenu.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => setMenuOpen(false));
      });

      document.addEventListener("click", event => {
        if (!siteHeader.contains(event.target)) setMenuOpen(false);
      });

      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && siteHeader.classList.contains("is-menu-open")) {
          setMenuOpen(false);
          menuToggle.focus();
        }
      });
    }

    const updateHeaderBackground = () => {
      siteHeader.classList.toggle("is-scrolled", window.scrollY >= siteHeader.offsetHeight);
    };
    window.addEventListener("scroll", updateHeaderBackground, { passive: true });
    updateHeaderBackground();
  }

  const navLinks = [...document.querySelectorAll(".nav-link")];
  const lamp = document.querySelector(".nav-lamp");
  const track = document.querySelector(".nav-track");

  function selectSection(hash) {
    const targetHash = typeof hash === "string" ? hash : "";
    const active = navLinks.find(link => link.hash === targetHash) || navLinks[0];
    if (!active) return;

    navLinks.forEach(link => {
      const isActive = link === active;
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

    if (lamp) {
      lamp.style.setProperty("--lamp-left", `${active.offsetLeft}px`);
      lamp.style.setProperty("--lamp-width", `${active.offsetWidth}px`);
    }
  }

  if (navLinks.length) {
    navLinks.forEach(link => link.addEventListener("click", () => selectSection(link.hash)));
    window.addEventListener("hashchange", () => selectSection(window.location.hash));
    selectSection(window.location.hash || "#inicio");

    const updateLamp = () => {
      const active = document.querySelector('.nav-link[aria-current="location"]');
      if (active) selectSection(active.hash);
    };

    if ("ResizeObserver" in window && track) new ResizeObserver(updateLamp).observe(track);
    else window.addEventListener("resize", updateLamp);

    const updateActiveSection = () => {
      const activationPoint = window.scrollY + (siteHeader?.offsetHeight || 0) + 24;
      const activeLink = navLinks.reduce((current, link) => {
        const section = document.getElementById(link.hash.slice(1));
        if (!section || section.getBoundingClientRect().top + window.scrollY > activationPoint) {
          return current;
        }
        return link;
      }, navLinks[0]);

      if (activeLink) selectSection(activeLink.hash);
    };

    let scrollFrame = 0;
    window.addEventListener("scroll", () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        updateActiveSection();
        scrollFrame = 0;
      });
    }, { passive: true });
    updateActiveSection();
  }

  // FAQ nativo também funciona sem JavaScript. Este fallback mantém um item aberto.
  const faqItems = [...document.querySelectorAll(".faq-item")];
  faqItems.forEach(item => item.addEventListener("toggle", () => {
    if (item.open) faqItems.forEach(other => { if (other !== item) other.open = false; });
  }));

  const form = document.getElementById("whatsapp-form");
  const property = document.getElementById("property");
  const problem = document.getElementById("problem");
  const details = document.getElementById("details");

  if (form) {
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.hidden = false;

    function buildMessage() {
      const message = ["Oi, JP!"];
      if (problem && problem.value) {
        message.push(`Estou com um problema: ${problem.value.toLowerCase()}.`);
      }
      if (property && property.value) {
        message.push(`O imóvel é do tipo ${property.value.toLowerCase()}.`);
      }
      if (details && details.value.trim()) message.push(details.value.trim());
      message.push("Podem me orientar?");

      return message.join(" ");
    }

    [problem].filter(Boolean).forEach(field => {
      const error = document.getElementById(`${field.id}-error`);
      field.addEventListener("invalid", () => {
        if (error) error.hidden = false;
        field.setAttribute("aria-invalid", "true");
      });
      field.addEventListener("change", () => {
        if (error) error.hidden = field.validity.valid;
        if (field.validity.valid) field.removeAttribute("aria-invalid");
      });
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      // Abre a conversa. O envio da mensagem é feito pelo visitante no WhatsApp.
      window.location.assign(whatsappUrl(buildMessage()));
    });
  }

  // Avaliações transcritas da captura fornecida pelo cliente.
  // Os trechos cortados na captura permanecem abreviados; a nota geral e o total não foram informados.
  const googleReviews = {
    source: "user-screenshot",
    rating: null,
    total: null,
    profileUrl: "https://www.google.com/search?q=JP+Ca%C3%A7a+Vazamentos+RP+avalia%C3%A7%C3%B5es",
    testimonials: [
      {
        name: "Leonardo Caetano…",
        rating: 5,
        text: "Serviço limpo, rápido e eficiente",
        context: "11 meses atrás",
        truncated: true,
      },
      {
        name: "Gabriela Domingue…",
        rating: 5,
        text: "Quero deixar registrado o excelente atendimento do serviço de caça-vazamento que contratei. A equipe é…",
        context: "11 meses atrás",
        truncated: true,
      },
      {
        name: "Marcus Cotrim",
        rating: 5,
        text: "Tudo correu muito bem.\n\nEquipe tem capacidade técnica ótima e atenciosa…",
        context: "1 ano atrás",
        truncated: true,
      },
      {
        name: "Daniela Barreira Al…",
        rating: 5,
        text: "Ótimo atendimento.",
        context: "1 ano atrás",
        truncated: true,
      },
    ],
  };

  function reviewSource(value) {
    try {
      const source = new URL(value);
      return source.protocol === "https:" ? source.href : null;
    } catch { return null; }
  }

  function setReviewStars(element, rating) {
    element.className = "review-stars";
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", `${rating.toLocaleString("pt-BR")} de 5 estrelas`);
    element.style.setProperty("--rating-fill", `${rating / 5 * 100}%`);
  }

  const testimonialsContainer = document.getElementById("testimonials");
  if (testimonialsContainer) {
    const profileLink = document.getElementById("reviews-google-link");
    const profileUrl = reviewSource(googleReviews.profileUrl);
    if (profileLink && profileUrl) profileLink.href = profileUrl;

    if (Number.isFinite(googleReviews.rating) && googleReviews.rating >= 0 && googleReviews.rating <= 5 && Number.isInteger(googleReviews.total) && googleReviews.total > 0) {
      document.getElementById("reviews-rating").textContent = googleReviews.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      setReviewStars(document.getElementById("reviews-stars"), googleReviews.rating);
      document.getElementById("reviews-count").textContent = `${googleReviews.total.toLocaleString("pt-BR")} avaliações no Google`;
      document.getElementById("reviews-summary").hidden = false;
    }

    googleReviews.testimonials.forEach(item => {
      const source = reviewSource(item.sourceUrl);
      if ((!source && googleReviews.source !== "user-screenshot") || !item.name || !item.text) return;
      const card = document.createElement("figure");
      card.className = "testimonial";
      const stars = document.createElement("span");
      if (Number.isFinite(item.rating) && item.rating >= 0 && item.rating <= 5) setReviewStars(stars, item.rating);
      const quote = document.createElement("blockquote");
      quote.textContent = `“${item.text}”`;
      const caption = document.createElement("figcaption");
      const name = document.createElement("strong");
      name.textContent = item.name;
      caption.append(name);
      if (item.context) {
        const context = document.createElement("span");
        context.textContent = item.context;
        caption.append(context);
      }
      if (source || (item.truncated && profileUrl)) {
        const link = document.createElement("a");
        link.href = source || profileUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source ? "Ver avaliação original" : "Ler no Google";
        caption.append(link);
      }
      card.append(stars, quote, caption);
      testimonialsContainer.append(card);
    });

    if (testimonialsContainer.childElementCount) {
      testimonialsContainer.hidden = false;

      const cards = [...testimonialsContainer.children];
      const controls = document.getElementById("reviews-carousel-controls");
      const previous = document.getElementById("reviews-prev");
      const next = document.getElementById("reviews-next");
      const position = document.getElementById("reviews-position");
      const mobileCarousel = window.matchMedia("(max-width: 767px)");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let currentSlide = 0;

      if (controls && previous && next && position) {
        const slideOffset = index => cards[index].offsetLeft - cards[0].offsetLeft;

        const updateCarousel = () => {
          if (!mobileCarousel.matches) return;
          currentSlide = cards.reduce((closest, card, index) =>
            Math.abs(slideOffset(index) - testimonialsContainer.scrollLeft) < Math.abs(slideOffset(closest) - testimonialsContainer.scrollLeft) ? index : closest, 0);
          const label = `${currentSlide + 1} de ${cards.length}`;
          if (position.textContent !== label) position.textContent = label;
          previous.disabled = currentSlide === 0;
          next.disabled = currentSlide === cards.length - 1;
        };

        const goToSlide = index => {
          const target = Math.max(0, Math.min(cards.length - 1, index));
          testimonialsContainer.scrollTo({ left: slideOffset(target), behavior: reducedMotion.matches ? "auto" : "smooth" });
        };

        const syncCarousel = () => {
          controls.hidden = !mobileCarousel.matches || cards.length < 2;
          if (mobileCarousel.matches) {
            testimonialsContainer.setAttribute("tabindex", "0");
            testimonialsContainer.setAttribute("role", "region");
            testimonialsContainer.setAttribute("aria-roledescription", "carrossel");
            updateCarousel();
          } else {
            testimonialsContainer.removeAttribute("tabindex");
            testimonialsContainer.removeAttribute("role");
            testimonialsContainer.removeAttribute("aria-roledescription");
          }
        };

        previous.addEventListener("click", () => goToSlide(currentSlide - 1));
        next.addEventListener("click", () => goToSlide(currentSlide + 1));
        testimonialsContainer.addEventListener("keydown", event => {
          if (!mobileCarousel.matches || event.target !== testimonialsContainer) return;
          const targets = { ArrowLeft: currentSlide - 1, ArrowRight: currentSlide + 1, Home: 0, End: cards.length - 1 };
          if (!(event.key in targets)) return;
          event.preventDefault();
          goToSlide(targets[event.key]);
        });

        let carouselFrame = 0;
        testimonialsContainer.addEventListener("scroll", () => {
          if (carouselFrame) return;
          carouselFrame = window.requestAnimationFrame(() => {
            updateCarousel();
            carouselFrame = 0;
          });
        }, { passive: true });
        mobileCarousel.addEventListener("change", syncCarousel);
        window.addEventListener("resize", syncCarousel);
        syncCarousel();
      }
    }
  }
})();
