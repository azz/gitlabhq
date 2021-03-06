import Vue from 'vue';
import notesApp from '~/notes/components/notes_app.vue';
import service from '~/notes/services/notes_service';
import * as mockData from '../mock_data';
import getSetTimeoutPromise from '../../helpers/set_timeout_promise_helper';

describe('note_app', () => {
  let mountComponent;
  let vm;

  beforeEach(() => {
    const IssueNotesApp = Vue.extend(notesApp);

    mountComponent = (data) => {
      const props = data || {
        noteableData: mockData.noteableDataMock,
        notesData: mockData.notesDataMock,
        userData: mockData.userDataMock,
      };

      return new IssueNotesApp({
        propsData: props,
      }).$mount();
    };
  });

  afterEach(() => {
    vm.$destroy();
  });

  describe('set data', () => {
    const responseInterceptor = (request, next) => {
      next(request.respondWith(JSON.stringify([]), {
        status: 200,
      }));
    };

    beforeEach(() => {
      Vue.http.interceptors.push(responseInterceptor);
      vm = mountComponent();
    });

    afterEach(() => {
      Vue.http.interceptors = _.without(Vue.http.interceptors, responseInterceptor);
    });

    it('should set notes data', () => {
      expect(vm.$store.state.notesData).toEqual(mockData.notesDataMock);
    });

    it('should set issue data', () => {
      expect(vm.$store.state.noteableData).toEqual(mockData.noteableDataMock);
    });

    it('should set user data', () => {
      expect(vm.$store.state.userData).toEqual(mockData.userDataMock);
    });

    it('should fetch notes', () => {
      expect(vm.$store.state.notes).toEqual([]);
    });
  });

  describe('render', () => {
    beforeEach(() => {
      Vue.http.interceptors.push(mockData.individualNoteInterceptor);
      vm = mountComponent();
    });

    afterEach(() => {
      Vue.http.interceptors = _.without(Vue.http.interceptors, mockData.individualNoteInterceptor);
    });

    it('should render list of notes', (done) => {
      const note = mockData.INDIVIDUAL_NOTE_RESPONSE_MAP.GET['/gitlab-org/gitlab-ce/issues/26/discussions.json'][0].notes[0];

      setTimeout(() => {
        expect(
          vm.$el.querySelector('.main-notes-list .note-header-author-name').textContent.trim(),
        ).toEqual(note.author.name);

        expect(vm.$el.querySelector('.main-notes-list .note-text').innerHTML).toEqual(note.note_html);
        done();
      }, 0);
    });

    it('should render form', () => {
      expect(vm.$el.querySelector('.js-main-target-form').tagName).toEqual('FORM');
      expect(
        vm.$el.querySelector('.js-main-target-form textarea').getAttribute('placeholder'),
      ).toEqual('Write a comment or drag your files here...');
    });

    it('should render form comment button as disabled', () => {
      expect(
        vm.$el.querySelector('.js-note-new-discussion').getAttribute('disabled'),
      ).toEqual('disabled');
    });
  });

  describe('while fetching data', () => {
    beforeEach(() => {
      vm = mountComponent();
    });

    it('should render loading icon', () => {
      expect(vm.$el.querySelector('.js-loading')).toBeDefined();
    });

    it('should render form', () => {
      expect(vm.$el.querySelector('.js-main-target-form').tagName).toEqual('FORM');
      expect(
        vm.$el.querySelector('.js-main-target-form textarea').getAttribute('placeholder'),
      ).toEqual('Write a comment or drag your files here...');
    });
  });

  describe('update note', () => {
    describe('individual note', () => {
      beforeEach(() => {
        Vue.http.interceptors.push(mockData.individualNoteInterceptor);
        spyOn(service, 'updateNote').and.callThrough();
        vm = mountComponent();
      });

      afterEach(() => {
        Vue.http.interceptors = _.without(
          Vue.http.interceptors,
          mockData.individualNoteInterceptor,
        );
      });

      it('renders edit form', (done) => {
        setTimeout(() => {
          vm.$el.querySelector('.js-note-edit').click();
          Vue.nextTick(() => {
            expect(vm.$el.querySelector('.js-vue-issue-note-form')).toBeDefined();
            done();
          });
        }, 0);
      });

      it('calls the service to update the note', (done) => {
        getSetTimeoutPromise()
          .then(() => {
            vm.$el.querySelector('.js-note-edit').click();
          })
          .then(Vue.nextTick)
          .then(() => {
            vm.$el.querySelector('.js-vue-issue-note-form').value = 'this is a note';
            vm.$el.querySelector('.js-vue-issue-save').click();

            expect(service.updateNote).toHaveBeenCalled();
          })
          // Wait for the requests to finish before destroying
          .then(Vue.nextTick)
          .then(done)
          .catch(done.fail);
      });
    });

    describe('dicussion note', () => {
      beforeEach(() => {
        Vue.http.interceptors.push(mockData.discussionNoteInterceptor);
        spyOn(service, 'updateNote').and.callThrough();
        vm = mountComponent();
      });

      afterEach(() => {
        Vue.http.interceptors = _.without(
          Vue.http.interceptors,
          mockData.discussionNoteInterceptor,
        );
      });

      it('renders edit form', (done) => {
        setTimeout(() => {
          vm.$el.querySelector('.js-note-edit').click();
          Vue.nextTick(() => {
            expect(vm.$el.querySelector('.js-vue-issue-note-form')).toBeDefined();
            done();
          });
        }, 0);
      });

      it('updates the note and resets the edit form', (done) => {
        getSetTimeoutPromise()
          .then(() => {
            vm.$el.querySelector('.js-note-edit').click();
          })
          .then(Vue.nextTick)
          .then(() => {
            vm.$el.querySelector('.js-vue-issue-note-form').value = 'this is a note';
            vm.$el.querySelector('.js-vue-issue-save').click();

            expect(service.updateNote).toHaveBeenCalled();
          })
          // Wait for the requests to finish before destroying
          .then(Vue.nextTick)
          .then(done)
          .catch(done.fail);
      });
    });
  });

  describe('new note form', () => {
    beforeEach(() => {
      vm = mountComponent();
    });

    it('should render markdown docs url', () => {
      const { markdownDocsPath } = mockData.notesDataMock;
      expect(vm.$el.querySelector(`a[href="${markdownDocsPath}"]`).textContent.trim()).toEqual('Markdown');
    });

    it('should render quick action docs url', () => {
      const { quickActionsDocsPath } = mockData.notesDataMock;
      expect(vm.$el.querySelector(`a[href="${quickActionsDocsPath}"]`).textContent.trim()).toEqual('quick actions');
    });
  });

  describe('edit form', () => {
    beforeEach(() => {
      Vue.http.interceptors.push(mockData.individualNoteInterceptor);
      vm = mountComponent();
    });

    afterEach(() => {
      Vue.http.interceptors = _.without(Vue.http.interceptors, mockData.individualNoteInterceptor);
    });

    it('should render markdown docs url', (done) => {
      setTimeout(() => {
        vm.$el.querySelector('.js-note-edit').click();
        const { markdownDocsPath } = mockData.notesDataMock;

        Vue.nextTick(() => {
          expect(
            vm.$el.querySelector(`.edit-note a[href="${markdownDocsPath}"]`).textContent.trim(),
          ).toEqual('Markdown is supported');
          done();
        });
      }, 0);
    });

    it('should not render quick actions docs url', (done) => {
      setTimeout(() => {
        vm.$el.querySelector('.js-note-edit').click();
        const { quickActionsDocsPath } = mockData.notesDataMock;

        Vue.nextTick(() => {
          expect(
            vm.$el.querySelector(`.edit-note a[href="${quickActionsDocsPath}"]`),
          ).toEqual(null);
          done();
        });
      }, 0);
    });
  });
});
