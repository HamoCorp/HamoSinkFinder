// content.js — MAIN world hooking script for Hamo Sink Finder (debugger in-place per-hook)
// Reads settings from window.__hamoSettings (object) — set by the extension before injection.

(function() {
  // Idempotency guard
  if (window.__hamoHooksLoaded) {
    console.log('Hamo: hooks already loaded — skipping.');
    return;
  }
  window.__hamoHooksLoaded = true;

  // Storage for originals so we can restore later
  window.__hamoOriginals = window.__hamoOriginals || {};

  // Read settings placed by extension; fallbacks
  const pageCfg = window.__hamoSettings || {};
  const settings = {
    enabled: pageCfg.enabled !== undefined ? pageCfg.enabled : true,
    testPhrase: pageCfg.testPhrase || 'ligma',
    HamoBreakPoint: pageCfg.HamoBreakPoint !== undefined ? pageCfg.HamoBreakPoint : true,
    HamoDecodeBreakPoint: pageCfg.HamoDecodeBreakPoint !== undefined ? pageCfg.HamoDecodeBreakPoint : true
  };

  if (!settings.enabled) {
    console.log('Hamo: disabled by settings.');
    return;
  }

  function containsPhrase(v) {
    return typeof v === 'string' && settings.testPhrase && v.includes(settings.testPhrase);
  }
  function short(v) {
    try { return typeof v === 'string' ? (v.length>200? v.substring(0,200)+'...': v) : String(v); } catch(e) { return '[value]'; }
  }

  console.log('%c[Hamo] Initializing hooks (MAIN world).', 'color:lime; font-weight:bold;', settings);

  // Helper to save original once
  function saveOriginal(key, value) {
    if (!window.__hamoOriginals[key]) window.__hamoOriginals[key] = value;
  }

  // -----------------------
  // innerHTML
  // -----------------------
  try {
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (desc && desc.set) {
      saveOriginal('innerHTML_set', desc.set);
      const origSet = desc.set;
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set(value) {
          try {
            if (containsPhrase(value)) {
              console.log('[Hamo] innerHTML set with phrase:', short(value), this);
              console.trace();
              if (settings.HamoBreakPoint) { debugger; } // <-- breakpoint in-place
            }
          } catch (e) {}
          return origSet.call(this, value);
        },
        configurable: true,
        enumerable: desc.enumerable
      });
    }
  } catch (e) { console.warn('Hamo innerHTML hook failed', e); }

  // -----------------------
  // outerHTML
  // -----------------------
  try {
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML');
    if (desc && desc.set) {
      saveOriginal('outerHTML_set', desc.set);
      const origSet = desc.set;
      Object.defineProperty(Element.prototype, 'outerHTML', {
        set(value) {
          try {
            if (containsPhrase(value)) {
              console.log('[Hamo] outerHTML set with phrase:', short(value), this);
              console.trace();
              if (settings.HamoBreakPoint) { debugger; } // <-- breakpoint in-place
            }
          } catch (e) {}
          return origSet.call(this, value);
        },
        configurable: true,
        enumerable: desc.enumerable
      });
    }
  } catch (e) { console.warn('Hamo outerHTML hook failed', e); }

  // -----------------------
  // textContent
  // -----------------------
  try {
    const desc = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    if (desc && desc.set) {
      saveOriginal('textContent_set', desc.set);
      const origSet = desc.set;
      Object.defineProperty(Node.prototype, 'textContent', {
        set(value) {
          try {
            if (containsPhrase(value)) {
              console.log('[Hamo] textContent set with phrase:', short(value), this);
              console.trace();
              if (settings.HamoBreakPoint) { debugger; } // <-- breakpoint in-place
            }
          } catch (e) {}
          return origSet.call(this, value);
        },
        configurable: true,
        enumerable: desc.enumerable
      });
    }
  } catch (e) { console.warn('Hamo textContent hook failed', e); }

  // -----------------------
  // setAttribute
  // -----------------------
  try {
    saveOriginal('setAttribute', Element.prototype.setAttribute);
    const origSetAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
      try {
        if (containsPhrase(value) || containsPhrase(name)) {
          console.log('[Hamo] setAttribute called:', name, short(value), this);
          console.trace();
          if (settings.HamoBreakPoint) { debugger; } // <-- breakpoint in-place
        }
      } catch (e) {}
      return origSetAttr.apply(this, arguments);
    };
  } catch (e) { console.warn('Hamo setAttribute hook failed', e); }

  // -----------------------
  // decodeURIComponent
  // -----------------------
  try {
    if (window.decodeURIComponent) {
      saveOriginal('decodeURIComponent', window.decodeURIComponent);
      const orig = window.decodeURIComponent;
      window.decodeURIComponent = function(str) {
        try {
          const result = orig.apply(this, arguments);
          if (containsPhrase(str) || (typeof result === 'string' && containsPhrase(result))) {
            console.log('[Hamo] decodeURIComponent:', short(str), '->', short(result));
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // <-- decode breakpoint in-place
          }
          return result;
        } catch (e) { throw e; }
      };
    }
  } catch (e) { console.warn('Hamo decodeURIComponent hook failed', e); }

  // -----------------------
  // decodeURI
  // -----------------------
  try {
    if (window.decodeURI) {
      saveOriginal('decodeURI', window.decodeURI);
      const orig = window.decodeURI;
      window.decodeURI = function(str) {
        try {
          const result = orig.apply(this, arguments);
          if (containsPhrase(str) || (typeof result === 'string' && containsPhrase(result))) {
            console.log('[Hamo] decodeURI:', short(str), '->', short(result));
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // <-- decode breakpoint in-place
          }
          return result;
        } catch (e) { throw e; }
      };
    }
  } catch (e) { console.warn('Hamo decodeURI hook failed', e); }

  // -----------------------
  // atob
  // -----------------------
  try {
    if (window.atob) {
      saveOriginal('atob', window.atob);
      const orig = window.atob;
      window.atob = function(str) {
        try {
          if (containsPhrase(str)) {
            console.log('[Hamo] atob called with phrase in arg:', short(str));
            console.trace();
            // For decoding-like functions, use decode breakpoint
            if (settings.HamoDecodeBreakPoint) { debugger; } // <-- decode breakpoint in-place
          }
        } catch(e){}
        const result = orig.apply(this, arguments);
        try {
          if (typeof result === 'string' && containsPhrase(result)) {
            console.log('[Hamo] atob result contains phrase:', short(result));
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // <-- decode breakpoint in-place
          }
        } catch(e){}
        return result;
      };
    }
  } catch (e) { console.warn('Hamo atob hook failed', e); }

  // -----------------------
  // unescape
  // -----------------------
  try {
    if (window.unescape) {
      saveOriginal('unescape', window.unescape);
      const orig = window.unescape;
      window.unescape = function(str) {
        try {
          if (containsPhrase(str)) {
            console.log('[Hamo] unescape called with phrase:', short(str));
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // <-- decode breakpoint in-place
          }
        } catch(e){}
        const result = orig.apply(this, arguments);
        try {
          if (typeof result === 'string' && containsPhrase(result)) {
            console.log('[Hamo] unescape result contains phrase:', short(result));
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // <-- decode breakpoint in-place
          }
        } catch(e){}
        return result;
      };
    }
  } catch (e) { console.warn('Hamo unescape hook failed', e); }

  // -----------------------
  // JSON.parse
  // -----------------------
  try {
    if (JSON && JSON.parse) {
      saveOriginal('JSON_parse', JSON.parse);
      const orig = JSON.parse;
      JSON.parse = function(str) {
        try {
          if (typeof str === 'string' && containsPhrase(str)) {
            console.log('[Hamo] JSON.parse called with phrase:', short(str));
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // <-- decode breakpoint in-place
          }
        } catch(e){}
        return orig.apply(this, arguments);
      };
    }
  } catch (e) { console.warn('Hamo JSON.parse hook failed', e); }

  // -----------------------
  // DOMParser.parseFromString
  // -----------------------
  try {
    if (DOMParser && DOMParser.prototype && DOMParser.prototype.parseFromString) {
      saveOriginal('DOMParser_parseFromString', DOMParser.prototype.parseFromString);
      const orig = DOMParser.prototype.parseFromString;
      DOMParser.prototype.parseFromString = function(str, type) {
        try {
          if (typeof str === 'string' && containsPhrase(str)) {
            console.log('[Hamo] DOMParser.parseFromString called with phrase:', short(str), 'type:', type);
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // <-- decode breakpoint in-place
          }
        } catch(e){}
        return orig.apply(this, arguments);
      };
    }
  } catch (e) { console.warn('Hamo DOMParser hook failed', e); }

  // -----------------------
  // Storage setItem (localStorage & sessionStorage)
  // -----------------------
  try {
    if (Storage && Storage.prototype && Storage.prototype.setItem) {
      saveOriginal('Storage_setItem', Storage.prototype.setItem);
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        try {
          if (containsPhrase(value) || containsPhrase(key)) {
            console.log('[Hamo] storage.setItem called:', short(key), short(value));
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // decode-like (data being stored)
          }
        } catch(e){}
        return orig.apply(this, arguments);
      };
    }
  } catch (e) { console.warn('Hamo storage.setItem hook failed', e); }

  // -----------------------
  // indexedDB.open -> patch IDBObjectStore.put/add after success
  // -----------------------
  try {
    if (window.indexedDB && window.indexedDB.open) {
      saveOriginal('indexedDB_open', window.indexedDB.open);
      const origOpen = window.indexedDB.open;
      window.indexedDB.open = function(name, version) {
        try {
          if (typeof name === 'string' && containsPhrase(name)) {
            console.log('[Hamo] indexedDB.open with phrase in name:', short(name));
            console.trace();
            if (settings.HamoDecodeBreakPoint) { debugger; } // decode-like
          }
        } catch(e){}
        const request = origOpen.apply(this, arguments);
        try {
          request.addEventListener('success', function(event) {
            try {
              if (!IDBObjectStore.prototype.__hamo_patched) {
                const origPut = IDBObjectStore.prototype.put;
                const origAdd = IDBObjectStore.prototype.add;
                saveOriginal('IDBObjectStore_put', origPut);
                saveOriginal('IDBObjectStore_add', origAdd);
                IDBObjectStore.prototype.put = function(value, key) {
                  try {
                    if ((typeof value === 'string' && containsPhrase(value)) || (typeof key === 'string' && containsPhrase(key))) {
                      console.log('[Hamo] indexedDB put:', short(JSON.stringify(value)), short(key));
                      console.trace();
                      if (settings.HamoDecodeBreakPoint) { debugger; } // decode-like
                    }
                  } catch(e){}
                  return origPut.apply(this, arguments);
                };
                IDBObjectStore.prototype.add = function(value, key) {
                  try {
                    if ((typeof value === 'string' && containsPhrase(value)) || (typeof key === 'string' && containsPhrase(key))) {
                      console.log('[Hamo] indexedDB add:', short(JSON.stringify(value)), short(key));
                      console.trace();
                      if (settings.HamoDecodeBreakPoint) { debugger; } // decode-like
                    }
                  } catch(e){}
                  return origAdd.apply(this, arguments);
                };
                IDBObjectStore.prototype.__hamo_patched = true;
              }
            } catch(e){}
          });
        } catch(e){}
        return request;
      };
    }
  } catch (e) { console.warn('Hamo indexedDB hook failed', e); }

  // -----------------------
  // postMessage
  // -----------------------
  try {
    if (window.postMessage) {
      saveOriginal('postMessage', window.postMessage);
      const origPost = window.postMessage;
      window.postMessage = function(message, targetOrigin, transfer) {
        try {
          if (typeof message === 'string' && containsPhrase(message)) {
            console.log('[Hamo] postMessage string with phrase:', short(message), 'origin:', targetOrigin);
            console.trace();
            if (settings.HamoBreakPoint) { debugger; } // sink-like
          } else if (typeof message === 'object' && JSON.stringify(message).includes(settings.testPhrase)) {
            console.log('[Hamo] postMessage object contains phrase:', short(JSON.stringify(message)));
            console.trace();
            if (settings.HamoBreakPoint) { debugger; } // sink-like
          }
        } catch(e){}
        return origPost.apply(this, arguments);
      };
    }
  } catch (e) { console.warn('Hamo postMessage hook failed', e); }

  // -----------------------
  // window.addEventListener('message', ...)
  // -----------------------
  try {
    saveOriginal('addEventListener', window.addEventListener);
    const origAddEvent = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'message' && typeof listener === 'function') {
        const wrapped = function(event) {
          try {
            if (event.data && typeof event.data === 'string' && containsPhrase(event.data)) {
              console.log('[Hamo] Message event received with phrase:', short(event.data), 'origin:', event.origin);
              console.trace();
              if (settings.HamoBreakPoint) { debugger; } // sink-like
            } else if (event.data && typeof event.data === 'object' && JSON.stringify(event.data).includes(settings.testPhrase)) {
              console.log('[Hamo] Message event object contains phrase:', short(JSON.stringify(event.data)), 'origin:', event.origin);
              console.trace();
              if (settings.HamoBreakPoint) { debugger; } // sink-like
            }
          } catch(e){}
          return listener.apply(this, arguments);
        };
        return origAddEvent.call(this, type, wrapped, options);
      }
      return origAddEvent.apply(this, arguments);
    };
  } catch (e) { console.warn('Hamo addEventListener hook failed', e); }

  // -----------------------
  // React dangerouslySetInnerHTML (via React.createElement)
  // -----------------------
  try {
    if (window.React && React.createElement) {
      saveOriginal('React_createElement', React.createElement);
      const origCreate = React.createElement;
      React.createElement = function(type, props, ...children) {
        try {
          if (props && props.dangerouslySetInnerHTML && typeof props.dangerouslySetInnerHTML.__html === 'string' && containsPhrase(props.dangerouslySetInnerHTML.__html)) {
            console.log('[Hamo] React dangerouslySetInnerHTML with phrase:', short(props.dangerouslySetInnerHTML.__html));
            console.trace();
            if (settings.HamoBreakPoint) { debugger; } // sink-like
          }
        } catch(e){}
        return origCreate.apply(this, arguments);
      };
    }
  } catch (e) { console.warn('Hamo React hook failed', e); }

  // -----------------------
  // jQuery html() / val()
  // -----------------------
  try {
    if (window.jQuery && jQuery.fn) {
      if (jQuery.fn.html) {
        saveOriginal('jQuery_html', jQuery.fn.html);
        const origHtml = jQuery.fn.html;
        jQuery.fn.html = function(value) {
          try {
            if (typeof value === 'string' && containsPhrase(value)) {
              console.log('[Hamo] jQuery.html called with phrase:', short(value), this);
              console.trace();
              if (settings.HamoBreakPoint) { debugger; } // sink-like
            }
          } catch(e){}
          return origHtml.apply(this, arguments);
        };
      }
      if (jQuery.fn.val) {
        saveOriginal('jQuery_val', jQuery.fn.val);
        const origVal = jQuery.fn.val;
        jQuery.fn.val = function(value) {
          try {
            if (typeof value === 'string' && containsPhrase(value)) {
              console.log('[Hamo] jQuery.val called with phrase:', short(value), this);
              console.trace();
              if (settings.HamoBreakPoint) { debugger; } // sink-like
            }
          } catch(e){}
          return origVal.apply(this, arguments);
        };
      }
    }
  } catch (e) { console.warn('Hamo jQuery hook failed', e); }

  // -----------------------
  // XMLHttpRequest open/send and response inspection
  // -----------------------
  try {
    if (XMLHttpRequest && XMLHttpRequest.prototype) {
      saveOriginal('XHR_open', XMLHttpRequest.prototype.open);
      saveOriginal('XHR_send', XMLHttpRequest.prototype.send);
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        try {
          if (typeof url === 'string' && containsPhrase(url)) {
            console.log('[Hamo] XHR open with phrase in URL:', method, short(url), this);
            console.trace();
            if (settings.HamoBreakPoint) { debugger; } // sink-like
          }
        } catch(e){}
        return origOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function(body) {
        try {
          if (body && typeof body === 'string' && containsPhrase(body)) {
            console.log('[Hamo] XHR send with phrase in payload:', short(body), this);
            console.trace();
            if (settings.HamoBreakPoint) { debugger; } // sink-like
          }
          const prevOnReady = this.onreadystatechange;
          this.onreadystatechange = function() {
            try {
              if (this.readyState === 4 && this.responseText && containsPhrase(this.responseText)) {
                console.log('[Hamo] XHR response contains phrase:', short(this.responseText));
                console.trace();
                if (settings.HamoBreakPoint) { debugger; } // sink-like
              }
            } catch(e){}
            if (prevOnReady) return prevOnReady.apply(this, arguments);
          };
        } catch(e){}
        return origSend.apply(this, arguments);
      };
    }
  } catch (e) { console.warn('Hamo XHR hook failed', e); }

  console.log('%c[Hamo] Hooks installed.', 'color:lime;');

  // Expose a restore function for convenience (restores originals, resets flag)
  try {
    if (!window.__hamoRestore) {
      window.__hamoRestore = function() {
        try {
          const o = window.__hamoOriginals || {};
          if (o.innerHTML_set) Object.defineProperty(Element.prototype, 'innerHTML', { set: o.innerHTML_set, configurable: true });
          if (o.outerHTML_set) Object.defineProperty(Element.prototype, 'outerHTML', { set: o.outerHTML_set, configurable: true });
          if (o.textContent_set) Object.defineProperty(Node.prototype, 'textContent', { set: o.textContent_set, configurable: true });
          if (o.setAttribute) Element.prototype.setAttribute = o.setAttribute;
          if (o.decodeURIComponent) window.decodeURIComponent = o.decodeURIComponent;
          if (o.decodeURI) window.decodeURI = o.decodeURI;
          if (o.atob) window.atob = o.atob;
          if (o.unescape) window.unescape = o.unescape;
          if (o.JSON_parse) JSON.parse = o.JSON_parse;
          if (o.DOMParser_parseFromString) DOMParser.prototype.parseFromString = o.DOMParser_parseFromString;
          if (o.Storage_setItem) Storage.prototype.setItem = o.Storage_setItem;
          if (o.indexedDB_open) window.indexedDB.open = o.indexedDB_open;
          if (o.IDBObjectStore_put) IDBObjectStore.prototype.put = o.IDBObjectStore_put;
          if (o.IDBObjectStore_add) IDBObjectStore.prototype.add = o.IDBObjectStore_add;
          if (o.postMessage) window.postMessage = o.postMessage;
          if (o.addEventListener) window.addEventListener = o.addEventListener;
          if (o.React_createElement) React.createElement = o.React_createElement;
          if (o.jQuery_html && window.jQuery && jQuery.fn) jQuery.fn.html = o.jQuery_html;
          if (o.jQuery_val && window.jQuery && jQuery.fn) jQuery.fn.val = o.jQuery_val;
          if (o.XHR_open) XMLHttpRequest.prototype.open = o.XHR_open;
          if (o.XHR_send) XMLHttpRequest.prototype.send = o.XHR_send;
          window.__hamoHooksLoaded = false;
          console.log('[Hamo] Restored originals');
        } catch(e) { console.warn('Hamo restore failed', e); }
      };
    }
  } catch (e) { /* ignore */ }

})();
