'use strict';

/**
 * Services for each tour step when you unlock features
 */

angular.module('habitrpg').factory('Guide',
['$rootScope', 'User', '$timeout', '$state',
function($rootScope, User, $timeout, $state) {

  var chapters = {
    intro: [
      [ // 0
        {
          state: 'tasks',
          element: ".task-column.todos",
          content: window.env.t('tourWelcome'),
          placement: "top"
        }

      ], [ // 1
        {
          state: 'tasks',
          element: '.sticky-wrapper',
          content: window.env.t('tourExp'),
          placement: 'bottom'
        }, {
          state: 'tasks',
          element: ".task-column.dailys",
          content: window.env.t('tourDailies'),
          placement: "top"
        }

      ], [ // 2
        {
          state: 'tasks',
          element: '.meter.health',
          content: window.env.t('tourHP'),
          placement: 'bottom'
        }, {
          state: 'tasks',
          element: ".task-column.habits",
          content: window.env.t('tourHabits'),
          placement: "right"
        }

      ], [ // 3
        {
          state: 'tasks',
          element: ".hero-stats",
          content: window.env.t('tourStats')
        }, {
          state: 'tasks',
          element: ".task-column.rewards",
          content: window.env.t('tourGP'),
          placement: 'left'
        }, {
          state: 'tasks',
          element: "nav.toolbar",
          content: window.env.t('tourMuchMore'),
          placement: "bottom",
          onHidden: function(){
            $rootScope.$watch('user.flags.customizationsNotification', _.partial(goto, 'intro', 4));
          }
        }
      ], [ // 4
        {
          element: '.main-herobox',
          content: window.env.t('customAvatarText'),
          placement: 'bottom',
          onHidden: function(){
            $rootScope.$watch('user.flags.itemsEnabled', _.partial(goto, 'intro', 5));
          }
        }
      ], [ // 5
        {
          state: 'tasks',
          element: 'div.rewards',
          content: window.env.t('storeUnlockedText'),
          placement: 'left',
          onHidden: function(){
            $rootScope.$watch('user.flags.partyEnabled', _.partial(goto, 'intro', 6));
          }
        }
      ], [ // 6
        {
          element: '.user-menu',
          content: window.env.t('partySysText'),
          placement: 'bottom'
        }
      ]
    ],
    classes: [
      [[ // 4
        {
          state: 'options.inventory.equipment',
          element: '.equipment-tab',
          title: window.env.t('classGear'),
          content: window.env.t('classGearText', {klass: User.user.stats.class})
        }, {
          state: 'options.profile.stats',
          element: ".allocate-stats",
          title: window.env.t('stats'),
          content: window.env.t('classStats')
        }, {
          state: 'options.profile.stats',
          element: ".auto-allocate",
          title: window.env.t('autoAllocate'),
          placement: 'left',
          content: window.env.t('autoAllocateText')
        }, {
          element: ".meter.mana",
          title: window.env.t('spells'),
          content: window.env.t('spellsText') + " <a target='_blank' href='http://habitrpg.wikia.com/wiki/Todos'>" + window.env.t('toDo') + "</a>."
        }, {
          orphan: true,
          title: window.env.t('readMore'),
          content: window.env.t('moreClass') + " <a href='http://habitrpg.wikia.com/wiki/Class_System' target='_blank'>Wikia</a>."
        }
      ]]
    ]
  }
  _.each(chapters, function(chapter){
    _(chapter).flatten().each(function(step) {
      step.content = "<div><div class='" + (env.worldDmg.guide ? "npc_justin_broken" : "npc_justin") + " float-left'></div>" + step.content + "</div>";
      $(step.element).popover('destroy'); // destroy existing hover popovers so we can add our own
      step.onShow = function(){
        // step.path doesn't work in Angular do to async ui-router. Our custom solution:
        if (step.state && !$state.is(step.state)) {
          // $state.go() returns a promise, necessary for async tour steps; however, that's not working here - have to use timeout instead :/
          $state.go(step.state);
          return $timeout(function(){});
        }
      }
    })
  })

  var tour = new Tour({
    backdrop: true,
    template: '<div class="popover" role="tooltip"> <div class="arrow"></div> <h3 class="popover-title"></h3> <div class="popover-content"></div> <div class="popover-navigation"> <div class="btn-group"> <button class="btn btn-sm btn-default" data-role="prev">&laquo; Prev</button> <button class="btn btn-sm btn-default" data-role="next">Next &raquo;</button> <button class="btn btn-sm btn-default" data-role="pause-resume" data-pause-text="Pause" data-resume-text="Resume">Pause</button> </div> <button class="btn btn-sm btn-default" data-role="end">' + window.env.t('endTour') + '</button> </div> </div>',
    //onEnd: function(){
    //  User.set({'flags.showTour': false});
    //}
  });

  var goto = function(chapter, page, force){
    if (User.user.flags.tour[chapter] > page && !force) return;
    var updates = {};updates['flags.tour.'+chapter] = page+1;
    User.set(updates);
    var end = tour._options.steps.length;
    tour.addSteps(chapters[chapter][page]);
    tour.restart(); // Tour doesn't quite mesh with our handling of flags.showTour, just restart it on page load
    tour.goTo(end);
  }
  /**
   * Init and show the welcome tour. Note we do it listening to a $rootScope broadcasted 'userLoaded' message,
   * this because we need to determine whether to show the tour *after* the user has been pulled from the server,
   * otherwise it's always start off as true, and then get set to false later
   */
  $rootScope.$on('userSynced', _.once(function(){
    if (!User.user.flags.tour) User.user.flags.tour = {};
    goto('intro', User.user.flags.tour.intro || 0);

    var alreadyShown = function(before, after) { return !(!before && after === true) };
    $rootScope.$watch('user.flags.dropsEnabled', _.flow(alreadyShown, function(already) {
      if (already) return;
      var eggs = User.user.items.eggs || {};
      if (!eggs) {
        eggs['Wolf'] = 1; // This is also set on the server
      }
      $rootScope.openModal('dropsEnabled');
    }));
    $rootScope.$watch('user.flags.rebirthEnabled', _.flow(alreadyShown, function(already) {
      if (already) return;
      $rootScope.openModal('rebirthEnabled');
    }));
  }));

  return {
    goto: goto
  };

}]);
