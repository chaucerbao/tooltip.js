var Tooltip = (function(window, document) {
  'use strict';

  var body = document.body,
    request = new XMLHttpRequest(),
    isInitialized = false,
    optionSets = [];

  var init = function() {
    if (!isInitialized) {
      /* Mousing over a tooltip shows its contents */
      body.addEventListener('mouseover', function(e) {
        if (e.target && e.target.classList.contains('tooltip-trigger')) { show(e.target); }
      });

      /* Mousing out of a tooltip hides its contents */
      body.addEventListener('mouseout', function(e) {
        if (e.target && e.target.classList.contains('tooltip-trigger')) { hide(e.target); }
      });

      isInitialized = true;
    }
  };

  /* Bind all tooltips in the DOM */
  var bind = function(targets, options) {
    init();

    var target;

    /* Merge the options argument with defaults */
    if (typeof options !== 'object') { options = {}; }
    options = extend({
      class: '',
      cache: false,
      iframe: false,
      onShow: function() {},
      onHide: function() {}
    }, options);

    optionSets.push(options);

    if (!targets.length) { targets = [targets]; }
    for (var i = 0, length = targets.length; i < length; i++) {
      target = targets[i];

      target.classList.add('tooltip-trigger');
      target.setAttribute('data-tooltip-options', optionSets.length);
    }
  };

  /* Show the tooltip */
  var show = function(trigger) {
    var content = trigger.getElementsByClassName('tooltip-content'),
      options = optionSets[parseInt(trigger.getAttribute('data-tooltip-options')) - 1],
      tooltip = (content.length) ? content[0] : createTooltip(options),
      target;

    if (!content.length) {
      /* Need to append to DOM here, otherwise we can't access the 'contentWindow' of an iFrame */
      trigger.appendChild(tooltip);

      target = trigger.getAttribute('data-tooltip');

      /* Populate the tooltip with content */
      if (target.match(/^([a-z]+:)?\/\//i) || target.match(/^[\w\-. \/]+$/)) {
        /* Using content from a URL or file */
        if (options.iframe) {
          /* Set the iFrame source to this target */
          tooltip.src = target;
          tooltip.addEventListener('load', function() { options.onShow(tooltip); });
        } else {
          /* Get the content through AJAX */
          request.open('GET', target, true);
          request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
              tooltip.innerHTML = request.responseText;
              options.onShow(tooltip);
            } else {
              tooltip.innerHTML = 'Unable to reach the content';
            }
          };
          request.onerror = function() {
            tooltip.innerHTML = 'Unable to reach the content';
          };

          request.send();
        }
      } else {
        /* Using the content inside an element ID or the 'target' parameter value as the content */
        var html = (target.match(/^#[a-zA-Z][\w:.-]*$/)) ? document.getElementById(target.replace(/^#/, '')).innerHTML : target;

        if (options.iframe) {
          tooltip.contentWindow.document.write(html);
        } else {
          tooltip.innerHTML = html;
        }

        options.onShow(tooltip);
      }
    }

    /* Activate CSS transitions */
    tooltip.removeEventListener('transitionend', removeTooltip);
    setTimeout(function() { tooltip.classList.add('is-active'); }, 0);

    return tooltip;
  };

  /* Hide the tooltip */
  var hide = function(trigger) {
    var tooltip = trigger.getElementsByClassName('tooltip-content is-active')[0];

    /* When hide() is triggered in quick succession, the cleanUp() from a previous call may remove the element before the current call completes */
    if (!tooltip) { return; }

    /* Remove the tooltip from the DOM */
    if (computed(tooltip, 'transition-duration') === '0s') {
      removeTooltip(tooltip);
    } else {
      tooltip.addEventListener('transitionend', removeTooltip);
      tooltip.classList.remove('is-active');
    }
  };

  /* Generate a new tooltip */
  var createTooltip = function(options) {
    var tooltip = (options.iframe) ? document.createElement('iframe') : document.createElement('div');

    /* Add classes to each element */
    tooltip.classList.add('tooltip-content');
    if (options.class.length) { tooltip.classList.add(options.class); }

    return tooltip;
  };

  /* Remove an existing tooltip */
  var removeTooltip = function(tooltip) {
    if (typeof this !== 'undefined') { tooltip = this; }

    var trigger = tooltip.parentNode,
      options = optionSets[parseInt(trigger.getAttribute('data-tooltip-options')) - 1];

    options.onHide(tooltip);

    if (!options.cache) { trigger.removeChild(tooltip); }
  };

  /* Get the computed value for a style property */
  var computed = function(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
  };

  /* Extend an object */
  var extend = function(out) {
    out = out || {};

    for (var i = 1, length = arguments.length; i < length; i++) {
      if (!arguments[i]) { continue; }

      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) { out[key] = arguments[i][key]; }
      }
    }

    return out;
  };

  return {
    bind: bind
  };
})(window, document);

window.tooltip = Tooltip;