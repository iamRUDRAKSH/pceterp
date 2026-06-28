const VALID_USER = '123B1E112';
  const VALID_PASS = 'Sv@9011924555';

  function doLogin() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('pwd').value;
    const err = document.getElementById('login-error');
    if (u === VALID_USER && p === VALID_PASS) {
      err.style.display = 'none';
      goTo('dashboard');
    } else {
      err.style.display = 'flex';
      document.getElementById('username').style.borderColor = '#c0392b';
      document.getElementById('pwd').style.borderColor = '#c0392b';
    }
  }

  // Allow Enter key to submit
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('login').classList.contains('active')) {
      doLogin();
    }
  });

  // Clear error styling when user types
  document.addEventListener('input', function(e) {
    if (e.target.id === 'username' || e.target.id === 'pwd') {
      e.target.style.borderColor = '';
      document.getElementById('login-error').style.display = 'none';
    }
  });

  function goTo(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  function togglePwd() {
    const p = document.getElementById('pwd');
    p.type = p.type === 'password' ? 'text' : 'password';
  }

  function createPdfStage() {
    const stage = document.createElement('div');
    stage.id = 'pdf-export-stage';
    stage.className = 'pdf-export-stage';
    document.body.appendChild(stage);
    return stage;
  }

  function stylePdfPage(root) {
    root.classList.add('pdf-export-page');
    root.style.width = '794px';
    root.style.margin = '0';
    root.style.padding = '0';
    root.style.background = '#fff';
    root.style.color = '#000';
    root.style.boxSizing = 'border-box';
    root.style.boxShadow = 'none';
    root.style.fontFamily = '"Times New Roman", serif';
  }

  function cloneForPdf(source, pageType) {
    const clone = source.cloneNode(true);
    stylePdfPage(clone);

    const remove = (selector) => {
      const node = clone.querySelector(selector);
      if (node) node.remove();
    };

    if (pageType === 'page1') {
      remove('.summary-table');
      remove('.result-status');
      remove('.result-note');
      remove('.result-date');
      remove('.controller-row');
    } else {
      remove('.grade-doc-header');
      remove('.sog-title');
      remove('.student-info-outer');
      remove('.grades-table');

      const insertBefore = clone.querySelector('.summary-table');
      const disclaimer = document.createElement('div');
      disclaimer.className = 'pdf-disclaimer';
      disclaimer.textContent = 'Note: The results published online are for immediate information only. These cannot be treated as original statement of Grade. Please verify the information from the original statement of Grade which will be issued by the college.';
      if (insertBefore) {
        clone.insertBefore(disclaimer, insertBefore);
      } else {
        clone.appendChild(disclaimer);
      }
    }

    return clone;
  }

  async function renderNodeToPdfPage(node, pdf, isFirstPage) {
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (!isFirstPage) {
      pdf.addPage();
    }

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
  }

  async function downloadPDF() {
    try {
      const source = document.querySelector('.grade-doc');
      if (!source) {
        alert('Nothing to export yet.');
        return;
      }

      if (!window.jspdf || !window.html2canvas) {
        alert('PDF helpers are still loading. Please try again in a moment.');
        return;
      }

      const { jsPDF } = window.jspdf;
      const stage = createPdfStage();
      const page1 = cloneForPdf(source, 'page1');
      const page2 = cloneForPdf(source, 'page2');
      stage.appendChild(page1);
      stage.appendChild(page2);

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));

      const pdf = new jsPDF('p', 'mm', 'a4');
      await renderNodeToPdfPage(page1, pdf, true);
      await renderNodeToPdfPage(page2, pdf, false);
      const pdfBytes = pdf.output('arraybuffer');
      pdf.save('grade-card.pdf');
      return pdfBytes;
    } catch (error) {
      console.error(error);
      alert('Sorry, the PDF could not be created right now.');
    } finally {
      const stage = document.getElementById('pdf-export-stage');
      if (stage) stage.remove();
    }
  }
