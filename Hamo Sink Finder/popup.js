document.addEventListener('DOMContentLoaded', () => {
  const enabledEl = document.getElementById('enabled');
  const testPhraseEl = document.getElementById('testPhrase');
  const breakpointEl = document.getElementById('breakpoint');
  const decodeBreakpointEl = document.getElementById('decodeBreakpoint');
  const saveBtn = document.getElementById('save');
  const resetBtn = document.getElementById('reset');
  const injectBtn = document.getElementById('inject');

  const defaults = {
    enabled: true,
    testPhrase: 'ligma',
    HamoBreakPoint: true,
    HamoDecodeBreakPoint: true
  };

  chrome.storage.local.get(defaults, (items) => {
    enabledEl.checked = !!items.enabled;
    testPhraseEl.value = items.testPhrase || defaults.testPhrase;
    breakpointEl.checked = !!items.HamoBreakPoint;
    decodeBreakpointEl.checked = !!items.HamoDecodeBreakPoint;
  });

  saveBtn.addEventListener('click', () => {
    const toSave = {
      enabled: enabledEl.checked,
      testPhrase: testPhraseEl.value || '',
      HamoBreakPoint: breakpointEl.checked,
      HamoDecodeBreakPoint: decodeBreakpointEl.checked
    };
    chrome.storage.local.set(toSave, () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || !tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: 'HAMO_SETTINGS_UPDATED', payload: toSave }, () => {
          if (chrome.runtime.lastError) {
            console.debug('Hamo: no content script in tab to receive settings.');
          }
        });
      });
      window.close();
    });
  });

  resetBtn.addEventListener('click', () => {
    chrome.storage.local.set(defaults, () => {
      enabledEl.checked = defaults.enabled;
      testPhraseEl.value = defaults.testPhrase;
      breakpointEl.checked = defaults.HamoBreakPoint;
      decodeBreakpointEl.checked = defaults.HamoDecodeBreakPoint;
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || !tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: 'HAMO_SETTINGS_UPDATED', payload: defaults }, () => {
          if (chrome.runtime.lastError) {
            console.debug('Hamo: no content script in tab to receive settings.');
          }
        });
      });
      window.close();
    });
  });

  // ---------- Inject flow: set settings in page MAIN world, then inject file in MAIN ----------
  injectBtn.addEventListener('click', async () => {
    // 1) read settings
    chrome.storage.local.get(['enabled','testPhrase','HamoBreakPoint','HamoDecodeBreakPoint'], (items) => {
      const cfg = {
        enabled: items.enabled ?? defaults.enabled,
        testPhrase: items.testPhrase ?? defaults.testPhrase,
        HamoBreakPoint: items.HamoBreakPoint ?? defaults.HamoBreakPoint,
        HamoDecodeBreakPoint: items.HamoDecodeBreakPoint ?? defaults.HamoDecodeBreakPoint
      };

      // 2) find active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) {
          alert('No active tab found.');
          return;
        }
        const tabId = tabs[0].id;

        // 3) Inject a small function into the page MAIN world that sets window.__hamoSettings
        chrome.scripting.executeScript({
          target: { tabId, allFrames: false },
          world: 'MAIN',
          func: (settings) => {
            // write settings into page global so the next injected script can read them
            try {
              window.__hamoSettings = settings;
              // optionally keep a timestamp
              window.__hamoSettingsTimestamp = Date.now();
            } catch (e) {
              // ignore
            }
          },
          args: [cfg]
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Hamo: could not set page settings:', chrome.runtime.lastError.message);
            alert('Failed to set settings in page: ' + chrome.runtime.lastError.message);
            return;
          }

          // 4) Now inject the actual hook script (content.js) into MAIN world
          chrome.scripting.executeScript({
            target: { tabId, allFrames: false },
            world: 'MAIN',
            files: ['content.js']
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.error('Hamo inject error:', chrome.runtime.lastError.message);
              alert('Injection failed: ' + chrome.runtime.lastError.message);
              return;
            }
            console.log('Hamo: injected content.js into tab', tabId, results);
            // optionally send a tiny message to isolated content script (if present) to let it know
            // that the MAIN hooks were installed. Not strictly necessary.
          });
        });
      });
    });
  });
});
