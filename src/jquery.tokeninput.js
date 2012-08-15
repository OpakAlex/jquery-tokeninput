/*
 * jQuery Plugin: Tokenizing Autocomplete Text Entry
 * Version 1.6.0
 *
 * Copyright (c) 2009 James Smith (http://loopj.com)
 * Licensed jointly under the GPL and MIT licenses,
 * choose which one suits your project best!
 *
 */
(function() {

  (function($) {
    var DEFAULT_CLASSES, DEFAULT_SETTINGS, KEY, POSITION, methods;
    DEFAULT_CLASSES = {
      tokenList: "token-input-list",
      token: "token-input-token",
      tokenDelete: "token-input-delete-token",
      selectedToken: "token-input-selected-token",
      highlightedToken: "token-input-highlighted-token",
      dropdown: "token-input-dropdown",
      dropdownItem: "token-input-dropdown-item",
      dropdownItem2: "token-input-dropdown-item2",
      selectedDropdownItem: "token-input-selected-dropdown-item",
      inputToken: "token-input-input-token",
      addToken: "token-input-add-token"
    };
    DEFAULT_SETTINGS = {
      IsFilterSearch: false,
      customFilterParams: false,
      method: "GET",
      queryParam: "q",
      searchDelay: 100,
      minChars: 0,
      propertyToSearch: "name",
      jsonContainer: null,
      contentType: "json",
      parent_id: "",
      parent_name: "",
      addTokenAllow: false,
      addTokenMethod: "POST",
      addTokenURL: "",
      prePopulate: null,
      processPrePopulate: false,
      hintText: "Type in a search term",
      noResultsText: "no_results",
      searchingText: "search",
      deleteText: "&times;",
      animateDropdown: true,
      theme: null,
      resultsFormatter: function(item) {
        return "<li>" + item[this.propertyToSearch] + "</li>";
      },
      tokenFormatter: function(item) {
        return "<li><p>" + item[this.propertyToSearch] + "</p></li>";
      },
      tokenLimit: null,
      tokenDelimiter: ",",
      preventDuplicates: true,
      tokenValue: "id",
      onClickInput: null,
      searchDuplicates: false,
      addInputCollback: false,
      addDeleteCollback: false,
      onResult: null,
      onAdd: null,
      onDelete: null,
      onReady: null,
      idPrefix: "token-input-"
    };
    POSITION = {
      BEFORE: 0,
      AFTER: 1,
      END: 2
    };
    KEY = {
      BACKSPACE: 8,
      TAB: 9,
      ENTER: 13,
      ESCAPE: 27,
      SPACE: 32,
      PAGE_UP: 33,
      PAGE_DOWN: 34,
      END: 35,
      HOME: 36,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      NUMPAD_ENTER: 108,
      MAC_COMMAND: 91
    };
    methods = {
      init: function(url_or_data_or_function, options) {
        var settings;
        settings = $.extend({}, DEFAULT_SETTINGS, options || {});
        return this.each(function() {
          return $(this).data("tokenInputObject", new $.TokenList(this, url_or_data_or_function, settings));
        });
      },
      clear: function() {
        this.data("tokenInputObject").clear();
        return this;
      },
      add: function(item) {
        this.data("tokenInputObject").add(item);
        return this;
      },
      remove: function(item) {
        this.data("tokenInputObject").remove(item);
        return this;
      },
      get: function() {
        return this.data("tokenInputObject").getTokens();
      }
    };
    $.fn.tokenInput = function(method) {
      if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
      } else {
        return methods.init.apply(this, arguments);
      }
    };
    window.$.TokenList = (function() {

      function TokenList(input, url_or_data, settings) {
        this.input = input;
        this.url_or_data = url_or_data;
        this.settings = settings;
        this.init();
      }

      TokenList.prototype.checkTokenLimit = function() {
        if (this.settings.tokenLimit !== null && this.token_count >= this.settings.tokenLimit) {
          this.input_box.hide();
          this.hide_dropdown();
        }
      };

      TokenList.prototype.resize_input = function() {
        var escaped, _ref;
        if (this.input_val === (this.input_val = (_ref = this.input_box) != null ? _ref.val() : void 0)) {
          return;
        }
        escaped = this.input_val.replace(/&/g, "&amp;").replace(/\s/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        this.input_resizer.html(escaped);
        return this.input_box.width(this.input_resizer.width() + 30);
      };

      TokenList.prototype.is_printable_character = function(keycode) {
        return (keycode >= 48 && keycode <= 90) || (keycode >= 96 && keycode <= 111) || (keycode >= 186 && keycode <= 192) || (keycode >= 219 && keycode <= 222);
      };

      TokenList.prototype.insert_token = function(item) {
        var self;
        this.this_token = this.settings.tokenFormatter(item);
        this.this_token = $(this.this_token).addClass(this.settings.classes.token).insertBefore(this.input_token);
        self = this;
        $("<span>" + this.settings.deleteText + "</span>").addClass(this.settings.classes.tokenDelete).appendTo(this.this_token).click(function() {
          self.delete_token($(this).parent());
          self.hidden_input.change();
          return false;
        });
        this.token_data = {
          id: item.id
        };
        this.token_data[this.settings.propertyToSearch] = item[this.settings.propertyToSearch];
        $.data(this.this_token.get(0), "tokeninput", item);
        this.saved_tokens = this.saved_tokens.slice(0, this.selected_token_index).concat([this.token_data]).concat(this.saved_tokens.slice(this.selected_token_index));
        this.selected_token_index++;
        this.update_hidden_input(this.saved_tokens, this.hidden_input);
        this.token_count += 1;
        if (this.settings.tokenLimit !== null && this.token_count >= this.settings.tokenLimit) {
          this.input_box.hide();
          this.hide_dropdown();
        }
        return this.this_token;
      };

      TokenList.prototype.add_token = function(item) {
        var callback, self;
        callback = this.settings.onAdd;
        if (this.token_count > 0 && this.settings.preventDuplicates) {
          this.found_existing_token = null;
          self = this;
          this.token_list.children().each(function() {
            var existing_data, existing_token;
            existing_token = $(this);
            existing_data = $.data(existing_token.get(0), "tokeninput");
            if (existing_data && existing_data.id === item.id) {
              self.found_existing_token = existing_token;
              return false;
            }
          });
          if (this.found_existing_token) {
            this.select_token(this.found_existing_token);
            this.input_token.insertAfter(this.found_existing_token);
            return;
          }
        }
        if (!(this.settings.tokenLimit != null) || this.token_count < this.settings.tokenLimit) {
          this.insert_token(item);
          this.checkTokenLimit();
        }
        if (this.ctrlPressed) {
          this.dropdown.css({
            position: "absolute",
            top: $(this.token_list).offset().top + $(this.token_list).outerHeight(),
            left: $(this.token_list).offset().left,
            "z-index": 999
          });
        } else {
          this.input_box.val("");
          this.hide_dropdown();
        }
        if ($.isFunction(callback) && this.settings.addInputCollback) {
          return callback.call(this.hidden_input, item);
        }
      };

      TokenList.prototype.select_token = function(token) {
        token.addClass(this.settings.classes.selectedToken);
        this.selected_token = token.get(0);
        this.input_box.val("");
        return this.hide_dropdown();
      };

      TokenList.prototype.deselect_token = function(token, position) {
        token.removeClass(this.settings.classes.selectedToken);
        this.selected_token = null;
        if (position === POSITION.BEFORE) {
          this.input_token.insertBefore(token);
          this.selected_token_index--;
        } else if (position === POSITION.AFTER) {
          this.input_token.insertAfter(token);
          this.selected_token_index++;
        } else {
          this.input_token.appendTo(this.token_list);
          this.selected_token_index = this.token_count;
        }
        return this.input_box.focus();
      };

      TokenList.prototype.toggle_select_token = function(token) {
        this.previous_selected_token = this.selected_token;
        if (this.selected_token) {
          this.deselect_token($(this.selected_token), POSITION.END);
        }
        if (this.previous_selected_token === token.get(0)) {
          return this.deselect_token(token, POSITION.END);
        } else {
          return this.select_token(token);
        }
      };

      TokenList.prototype.delete_token = function(token) {
        var callback, index;
        this.token_data = $.data(token.get(0), "tokeninput");
        callback = this.settings.onDelete;
        index = token.prevAll().length;
        if (index > this.selected_token_index) {
          index--;
        }
        token.remove();
        this.selected_token = null;
        this.saved_tokens = this.saved_tokens.slice(0, index).concat(this.saved_tokens.slice(index + 1));
        if (index < this.selected_token_index) {
          this.selected_token_index--;
        }
        this.update_hidden_input(this.saved_tokens, this.hidden_input);
        this.token_count -= 1;
        if (this.settings.tokenLimit !== null) {
          this.input_box.show().val("").focus();
        }
        if ($.isFunction(callback) && this.settings.addDeleteCollback) {
          return callback.call(this.hidden_input, this.token_data);
        }
      };

      TokenList.prototype.update_hidden_input = function(saved_tokens, hidden_input) {
        var self;
        self = this;
        this.token_values = $.map(saved_tokens, function(el) {
          return el[self.settings.tokenValue];
        });
        return hidden_input.val(this.token_values.join(this.settings.tokenDelimiter));
      };

      TokenList.prototype.hide_dropdown = function() {
        this.dropdown.hide().empty();
        return this.selected_dropdown_item = null;
      };

      TokenList.prototype.show_dropdown = function() {
        return this.dropdown.css({
          position: "absolute",
          top: $(this.token_list).offset().top + $(this.token_list).outerHeight(),
          left: $(this.token_list).offset().left,
          "z-index": 999
        }).show();
      };

      TokenList.prototype.show_dropdown_searching = function() {
        if (this.settings.searchingText) {
          this.dropdown.html("<p>" + this.settings.searchingText + "</p>");
          return this.show_dropdown();
        }
      };

      TokenList.prototype.show_dropdown_hint = function() {
        if (this.settings.hintText) {
          this.dropdown.html("<p>" + this.settings.hintText + "</p>");
          return this.show_dropdown();
        }
      };

      TokenList.prototype.escape_regex_chars = function(str) {
        return str != null ? str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") : void 0;
      };

      TokenList.prototype.highlight_term = function(value, term) {
        var self;
        self = this;
        if (!value) {
          return "";
        } else {
          return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + self.escape_regex_chars(term) + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<b>$1</b>");
        }
      };

      TokenList.prototype.find_value_and_highlight_term = function(template, value, term) {
        var self;
        self = this;
        return template.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + self.escape_regex_chars(value) + ")(?![^<>]*>)(?![^&;]+;)", "g"), self.highlight_term(value, term));
      };

      TokenList.prototype.populate_dropdown = function(query, results) {
        var self;
        self = this;
        if (results && results.length) {
          self.dropdown.empty();
          self.dropdown_ul = $("<ul>").appendTo(self.dropdown).mouseover(function(event) {
            return self.select_dropdown_item($(event.target).closest("li"));
          }).mousedown(function(event) {
            self.add_token($(event.target).closest("li").data("tokeninput"));
            self.hidden_input.change();
            return false;
          }).hide();
          this.realArray_tokens = $.makeArray(this.saved_tokens);
          this.realArray_token_ids = [];
          $.map(this.realArray_tokens, function(val, i) {
            return self.realArray_token_ids.push(parseInt(val.id));
          });
          $.each(results, function(index, value) {
            var this_li;
            if ($.inArray(parseInt(value.id), self.realArray_token_ids) < 0) {
              this_li = self.settings.resultsFormatter(value);
              this_li = self.find_value_and_highlight_term(this_li, value[self.settings.propertyToSearch], self.query);
              this_li = $(this_li).appendTo(self.dropdown_ul);
              if (index % 2) {
                this_li.addClass(self.settings.classes.dropdownItem);
              } else {
                this_li.addClass(self.settings.classes.dropdownItem2);
              }
              if (index === 0) {
                self.select_dropdown_item(this_li);
              }
              return $.data(this_li.get(0), "tokeninput", value);
            }
          });
          this.show_dropdown();
          if (this.settings.animateDropdown) {
            return this.dropdown_ul.slideDown("fast");
          } else {
            return this.dropdown_ul.show();
          }
        } else {
          if (this.settings.noResultsTextCallback && $.isFunction(this.settings.noResultsTextCallback)) {
            this.settings.noResultsTextCallback();
            return this.hide_dropdown();
          } else {
            this.dropdown.html("<p>" + this.settings.noResultsText + "</p>");
            return this.show_dropdown();
          }
        }
      };

      TokenList.prototype.select_dropdown_item = function(item) {
        if (item) {
          if (this.selected_dropdown_item) {
            this.deselect_dropdown_item($(this.selected_dropdown_item));
          }
          item.addClass(this.settings.classes.selectedDropdownItem);
          return this.selected_dropdown_item = item.get(0);
        }
      };

      TokenList.prototype.deselect_dropdown_item = function(item) {
        item.removeClass(this.settings.classes.selectedDropdownItem);
        return this.selected_dropdown_item = null;
      };

      TokenList.prototype.do_search = function() {
        var query, self;
        self = this;
        query = this.input_box.val().toLowerCase();
        if (this.selected_token) {
          this.deselect_token($(this.selected_token), POSITION.AFTER);
        }
        this.show_dropdown_searching();
        clearTimeout(this.timeout);
        return this.timeout = setTimeout(function() {
          return self.run_search(query);
        }, self.settings.searchDelay);
      };

      TokenList.prototype.run_search = function(query) {
        var ajax_params, cache_key, cached_results, custom_params, i, id_array, param_array, parts, pdf_catalogue_id_in, results, self, url;
        if (query.length === 0) {
          if ($.isFunction(this.settings.onClickInput)) {
            this.settings.onClickInput.call();
          }
        }
        self = this;
        cache_key = query + this.computeURL();
        cached_results = this.cache.get(cache_key);
        if (cached_results && !this.settings.IsFilterSearch) {
          return this.populate_dropdown(query, cached_results);
        } else {
          if (this.settings.url) {
            url = this.computeURL();
            ajax_params = {};
            ajax_params.data = {};
            if (url.indexOf("?") > -1) {
              parts = url.split("?");
              ajax_params.url = parts[0];
              param_array = parts[1].split("&");
              $.each(param_array, function(index, value) {
                var kv;
                kv = value.split("=");
                return ajax_params.data[kv[0]] = kv[1];
              });
            } else {
              ajax_params.url = url;
            }
            if (this.settings.IsFilterSearch) {
              pdf_catalogue_id_in = $("#" + this.settings.parent_id).attr("value");
              if (pdf_catalogue_id_in.length < 1) {
                this.hide_dropdown();
                return;
              }
              url += "&" + this.settings.queryParam + "=" + query;
              id_array = pdf_catalogue_id_in.split(",");
              i = 0;
              while (i < id_array.length) {
                url += "&" + encodeURIComponent("q[" + self.settings.parent_name + "][]") + "=" + id_array[i];
                i++;
              }
              return $.getJSON(url, function(results) {
                if ($.isFunction(self.settings.onResult)) {
                  results = self.settings.onResult.call(self.hidden_input, results);
                }
                if (!self.settings.IsFilterSearch) {
                  self.cache.add(cache_key, (self.settings.jsonContainer ? results[self.settings.jsonContainer] : results));
                }
                if (self.input_box.val().toLowerCase() === query) {
                  return self.populate_dropdown(query, (self.settings.jsonContainer ? results[self.settings.jsonContainer] : results));
                }
              });
            } else if (this.settings.customFilterParams) {
              custom_params = {};
              $.each(this.settings.customFilterParams, function(k, v) {
                var param_values;
                param_values = {};
                $.each(v, function(kk, vv) {
                  var param_val;
                  param_val = $("#" + vv).val();
                  if (param_val) {
                    return param_values[kk] = param_val;
                  }
                });
                return custom_params[k] = param_values;
              });
              url += "&" + this.settings.queryParam + "=" + query + "&" + $.param(custom_params);
              return $.getJSON(url, function(results) {
                if ($.isFunction(self.settings.onResult)) {
                  results = self.settings.onResult.call(self.hidden_input, results);
                }
                if (self.input_box.val().toLowerCase() === query) {
                  return self.populate_dropdown(query, (self.settings.jsonContainer ? results[self.settings.jsonContainer] : results));
                }
              });
            } else {
              ajax_params.data[this.settings.queryParam] = query;
              ajax_params.type = this.settings.method;
              ajax_params.dataType = this.settings.contentType;
              if (this.settings.crossDomain) {
                ajax_params.dataType = "json";
              }
              ajax_params.success = function(results) {
                if ($.isFunction(self.settings.onResult)) {
                  results = self.settings.onResult.call(self.hidden_input, results);
                }
                if (!self.settings.IsFilterSearch) {
                  self.cache.add(cache_key, (self.settings.jsonContainer ? results[self.settings.jsonContainer] : results));
                }
                if (self.input_box.val().toLowerCase() === query) {
                  return self.populate_dropdown(query, (self.settings.jsonContainer ? results[self.settings.jsonContainer] : results));
                }
              };
              ajax_params.error = function(error) {
                switch (error.status) {
                  case 403:
                    return alert("403: You are unauthorized to view the token endpoint.");
                  case 404:
                    return alert("404: Token endpoint does not exist.");
                }
              };
              return $.ajax(ajax_params);
            }
          } else if (this.settings.local_data) {
            results = $.grep(this.settings.local_data, function(row) {
              return row[self.settings.propertyToSearch].toLowerCase().indexOf(query.toLowerCase()) > -1;
            });
            if ($.isFunction(self.settings.onResult)) {
              results = self.settings.onResult.call(self.hidden_input, results);
            }
            self.cache.add(cache_key, results);
            return self.populate_dropdown(query, results);
          }
        }
      };

      TokenList.prototype.computeURL = function() {
        var self, url;
        self = this;
        url = this.settings.url;
        if (typeof this.settings.url === "function") {
          url = this.settings.url.call();
        }
        return url;
      };

      TokenList.prototype.init = function() {
        var li_data, self, url,
          _this = this;
        self = this;
        if ($.type(this.url_or_data) === "string" || $.type(this.url_or_data) === "function") {
          this.settings.url = this.url_or_data;
          url = this.computeURL();
          if (this.settings.crossDomain === void 0) {
            if (url.indexOf("://") === -1) {
              this.settings.crossDomain = false;
            } else {
              this.settings.crossDomain = location.href.split(/\/+/g)[1] !== url.split(/\/+/g)[1];
            }
          }
        } else {
          if (typeof this.url_or_data === "object") {
            this.settings.local_data = this.url_or_data;
          }
        }
        if (this.settings.classes) {
          this.settings.classes = $.extend({}, DEFAULT_CLASSES, self.settings.classes);
        } else if (this.settings.theme) {
          this.settings.classes = {};
          $.each(DEFAULT_CLASSES, function(key, value) {
            return _this.settings.classes[key] = value + "-" + _this.settings.theme;
          });
        } else {
          self.settings.classes = DEFAULT_CLASSES;
        }
        if (this.settings.addTokenURL !== "") {
          this.settings.addTokenAllow = true;
          this.settings.noResultsText = I18n.t("admin_js.no_results") + " <a href=\"#\" class=\"" + $(this.input).attr("id") + "\">" + I18n.t("admin_js.add_link") + "</a>";
        }
        this.settings.classes.addToken = $(this.input).attr("id");
        this.saved_tokens = [];
        this.token_count = 0;
        this.cache = new $.TokenList.Cache();
        this.timeout = void 0;
        this.input_val = void 0;
        this.ctrlPressed = false;
        this.input_box = $("<input type=\"text\"  autocomplete=\"off\">").css({
          outline: "none"
        }).attr("id", self.settings.idPrefix + self.input.id).focus(function() {
          if (self.settings.tokenLimit === null || self.settings.tokenLimit !== self.token_count) {
            self.blur = false;
            self.show_dropdown_hint();
            self.do_search();
            return setTimeout((function() {
              return self.blur = true;
            }), 400);
          }
        }).blur(function() {
          setTimeout((function() {
            if (self.blur) {
              self.hide_dropdown();
              return self.blur = true;
            }
          }), 400);
          $(this).data("tag", $(this).val());
          return $(this).val("");
        }).bind("keyup keydown blur update", self.resize_input).keydown(function(event) {
          self.previous_token = void 0;
          self.next_token = void 0;
          switch (event.keyCode) {
            case KEY.LEFT:
            case KEY.RIGHT:
            case KEY.UP:
            case KEY.DOWN:
              if (!$(this).val() && $(this).val().length !== 0) {
                self.previous_token = self.input_token.prev();
                self.next_token = self.input_token.next();
                if ((self.previous_token.length && self.previous_token.get(0) === self.selected_token) || (self.next_token.length && self.next_token.get(0) === self.selected_token)) {
                  if (event.keyCode === KEY.LEFT || event.keyCode === KEY.UP) {
                    return self.deselect_token($(self.selected_token), POSITION.BEFORE);
                  } else {
                    return self.deselect_token($(self.selected_token), POSITION.AFTER);
                  }
                } else if ((event.keyCode === KEY.LEFT || event.keyCode === KEY.UP) && self.previous_token.length) {
                  return self.select_token($(self.previous_token.get(0)));
                } else {
                  if ((event.keyCode === KEY.RIGHT || event.keyCode === KEY.DOWN) && self.next_token.length) {
                    return self.select_token($(self.next_token.get(0)));
                  }
                }
              } else {
                self.dropdown_item = null;
                if (event.keyCode === KEY.DOWN || event.keyCode === KEY.RIGHT) {
                  self.dropdown_item = $(self.selected_dropdown_item).next();
                } else {
                  self.dropdown_item = $(self.selected_dropdown_item).prev();
                }
                if (self.dropdown_item.length) {
                  self.select_dropdown_item(self.dropdown_item);
                }
                return false;
              }
              break;
            case KEY.BACKSPACE:
              self.previous_token = self.input_token.prev();
              if (!$(this).val().length) {
                if (self.selected_token) {
                  self.delete_token($(self.selected_token));
                  self.hidden_input.change();
                } else {
                  if (self.previous_token.length) {
                    self.select_token($(self.previous_token.get(0)));
                  }
                }
                return false;
              } else if ($(this).val().length === 1) {
                return self.hide_dropdown();
              } else {
                return setTimeout((function() {
                  return self.do_search();
                }), 5);
              }
              break;
            case KEY.TAB:
            case KEY.ENTER:
            case KEY.NUMPAD_ENTER:
            case KEY.COMMA:
              if (self.selected_dropdown_item) {
                self.add_token($(self.selected_dropdown_item).data("tokeninput"));
                self.hidden_input.change();
                return false;
              }
              break;
            case KEY.ESCAPE:
              self.hide_dropdown();
              return true;
            default:
              if (event.ctrlKey || event.which === KEY.MAC_COMMAND) {
                return self.ctrlPressed = true;
              } else {
                if (String.fromCharCode(event.which)) {
                  return setTimeout((function() {
                    return self.do_search();
                  }), 5);
                }
              }
          }
        }).keyup(function(event) {
          if (event.ctrlKey || event.which === KEY.MAC_COMMAND) {
            return self.ctrlPressed = false;
          }
        });
        self.hidden_input = $(self.input).hide().val("").focus(function() {
          return self.input_box.focus();
        }).blur(function() {
          return self.input_box.blur();
        });
        self.selected_token = null;
        self.selected_token_index = 0;
        self.selected_dropdown_item = null;
        self.token_list = $("<ul />").addClass(self.settings.classes.tokenList).click(function(event) {
          var li;
          li = $(event.target).closest("li");
          if (li && li.get(0) && $.data(li.get(0), "tokeninput")) {
            return self.toggle_select_token(li);
          } else {
            if (self.selected_token) {
              self.deselect_token($(self.selected_token), POSITION.END);
            }
            return self.input_box.focus();
          }
        }).mouseover(function(event) {
          var li;
          li = $(event.target).closest("li");
          if (li && self.selected_token !== this) {
            return li.addClass(self.settings.classes.highlightedToken);
          }
        }).mouseout(function(event) {
          var li;
          li = $(event.target).closest("li");
          if (li && self.selected_token !== this) {
            return li.removeClass(self.settings.classes.highlightedToken);
          }
        }).insertBefore(self.hidden_input);
        self.input_token = $("<li />").addClass(self.settings.classes.inputToken).appendTo(self.token_list).append(self.input_box);
        self.dropdown = $("<div>").addClass(self.settings.classes.dropdown).appendTo("body").hide();
        self.input_resizer = $("<tester/>").insertAfter(self.input_box).css({
          position: "absolute",
          top: -9999,
          left: -9999,
          width: "auto",
          fontSize: self.input_box.css("fontSize"),
          fontFamily: self.input_box.css("fontFamily"),
          fontWeight: self.input_box.css("fontWeight"),
          letterSpacing: self.input_box.css("letterSpacing"),
          whiteSpace: "nowrap"
        });
        if (self.settings.addTokenAllow) {
          $("." + self.settings.classes.addToken).die("click").live("click", function(e) {
            var addURL, contentType, tagName;
            e.preventDefault();
            if ($.isFunction(self.settings.createCallback)) {
              self.settings.createCallback.call();
              return;
            }
            tagName = self.input_token.find("input:first").data("tag");
            addURL = self.settings.addTokenURL;
            contentType = (self.settings.crossDomain ? "jsonp" : self.settings.contentType);
            if (tagName && tagName.length > 0) {
              return $.ajax({
                url: addURL,
                type: self.settings.addTokenMethod,
                data: {
                  q: tagName
                },
                dataType: "json",
                success: function(newTag) {
                  if (newTag) {
                    self.dropdown.find("p").text("Added!");
                    self.add_token(newTag);
                    return setTimeout((function() {
                      return self.hide_dropdown();
                    }), 2000);
                  }
                }
              });
            }
          });
        }
        self.hidden_input.val("");
        li_data = self.settings.prePopulate || self.hidden_input.data("pre");
        if (self.settings.processPrePopulate && $.isFunction(self.settings.onResult)) {
          li_data = self.settings.onResult.call(self.hidden_input, li_data);
        }
        if (li_data && li_data.length) {
          $.each(li_data, function(index, value) {
            self.insert_token(value);
            return self.checkTokenLimit();
          });
        }
        if ($.isFunction(self.settings.onReady)) {
          return self.settings.onReady.call();
        }
      };

      TokenList.prototype.clear = function() {
        var self;
        self = this;
        self.token_list.children("li").each(function() {
          if ($(this).children("input").length === 0) {
            return self.delete_token($(this));
          }
        });
        return {
          add: function(item) {
            return this.add_token(item);
          },
          remove: function(item) {
            self = this;
            return this.token_list.children("li").each(function() {
              var match, prop;
              if ($(this).children("input").length === 0) {
                self.currToken = $(this).data("tokeninput");
                match = true;
                for (prop in item) {
                  if (item[prop] !== currToken[prop]) {
                    match = false;
                    break;
                  }
                }
                if (match) {
                  return self.delete_token($(this));
                }
              }
            });
          },
          getTokens: function() {
            return self.saved_tokens;
          }
        };
      };

      return TokenList;

    })();
    return window.$.TokenList.Cache = (function() {

      function Cache(options) {
        this.settings = $.extend({
          max_size: 500
        }, options);
        this.data = {};
        this.size = 0;
      }

      Cache.prototype.flush = function() {
        this.data = {};
        return this.size = 0;
      };

      Cache.prototype.add = function(query, results) {
        if (this.size > this.settings.max_size) {
          this.flush();
        }
        if (!this.data[query]) {
          this.size += 1;
        }
        return this.data[query] = results;
      };

      Cache.prototype.get = function(query) {
        return this.data[query];
      };

      return Cache;

    })();
  })(jQuery);

}).call(this);
