import React from 'react';
import Reflux from 'reflux';
import ApiMixin from '../../mixins/apiMixin';
import ActionLink from './actionLink';
import DropdownLink from '../../components/dropdownLink';
import IndicatorStore from '../../stores/indicatorStore';
import MenuItem from '../../components/menuItem';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import SelectedGroupStore from '../../stores/selectedGroupStore';
import {t, tn} from '../../locale';

const StreamActions = React.createClass({
  propTypes: {
    orgId: React.PropTypes.string.isRequired,
    projectId: React.PropTypes.string.isRequired,
    groupIds: React.PropTypes.instanceOf(Array).isRequired,
    onRealtimeChange: React.PropTypes.func.isRequired,
    onSelectStatsPeriod: React.PropTypes.func.isRequired,
    realtimeActive: React.PropTypes.bool.isRequired,
    statsPeriod: React.PropTypes.string.isRequired
  },

  mixins: [
    ApiMixin,
    Reflux.listenTo(SelectedGroupStore, 'onSelectedGroupChange'),
    PureRenderMixin
  ],

  getInitialState() {
    return {
      datePickerActive: false,

      anySelected: false,
      multiSelected: false, // more than one selected
      pageSelected: false, // all on current page selected (e.g. 25)
      allSelected: false, // all in current search query selected (e.g. 1000+)
    };
  },

  selectAll() {
    this.setState({
      allSelected: true
    });
  },

  selectStatsPeriod(period) {
    return this.props.onSelectStatsPeriod(period);
  },

  actionSelectedGroups(callback) {
    let selectedIds;

    if (this.state.allSelected) {
      selectedIds = undefined; // undefined means "all"
    } else {
      let itemIdSet = SelectedGroupStore.getSelectedIds();
      selectedIds = this.props.groupIds.filter(
        (itemId) => itemIdSet.has(itemId)
      );
    }

    callback(selectedIds);

    this.deselectAll();
  },

  deselectAll() {
    SelectedGroupStore.deselectAll();
    this.setState({allSelected: false});
  },

  onUpdate(data, event) {
    this.actionSelectedGroups((itemIds) => {
      let loadingIndicator = IndicatorStore.add(t('Saving changes..'));

      this.api.bulkUpdate({
        orgId: this.props.orgId,
        projectId: this.props.projectId,
        itemIds: itemIds,
        data: data
      }, {
        complete: () => {
          IndicatorStore.remove(loadingIndicator);
        }
      });
    });
  },

  onDelete(event) {
    let loadingIndicator = IndicatorStore.add(t('Removing events..'));

    this.actionSelectedGroups((itemIds) => {
      this.api.bulkDelete({
        orgId: this.props.orgId,
        projectId: this.props.projectId,
        itemIds: itemIds
      }, {
        complete: () => {
          IndicatorStore.remove(loadingIndicator);
        }
      });
    });
  },

  onMerge(event) {
    let loadingIndicator = IndicatorStore.add(t('Merging events..'));

    this.actionSelectedGroups((itemIds) => {
      this.api.merge({
        orgId: this.props.orgId,
        projectId: this.props.projectId,
        itemIds: itemIds,
      }, {
        complete: () => {
          IndicatorStore.remove(loadingIndicator);
        }
      });
    });
  },

  onSelectedGroupChange() {
    this.setState({
      pageSelected: SelectedGroupStore.allSelected(),
      multiSelected: SelectedGroupStore.multiSelected(),
      anySelected: SelectedGroupStore.anySelected()
    });
  },

  onSelectAll() {
    SelectedGroupStore.toggleSelectAll();
  },

  onRealtimeChange(evt) {
    this.props.onRealtimeChange(!this.props.realtimeActive);
  },

  render() {
    // TODO(mitsuhiko): very unclear how to translate this
    return (
      <div>
        <div className="stream-actions row">
          <div className="stream-actions-left col-md-6 col-sm-8 col-xs-8">
            <div className="checkbox">
              <input type="checkbox" className="chk-select-all"
                     onChange={this.onSelectAll}
                     checked={this.state.pageSelected} />
            </div>
            <div className="btn-group">
              <ActionLink
                 className="btn btn-default btn-sm action-resolve"
                 disabled={!this.state.anySelected}
                 onAction={this.onUpdate.bind(this, {status: 'resolved'})}
                 buttonTitle={t('Resolve')}
                 confirmationQuestion={
                  this.state.allSelected
                    ? t('Are you sure you want to resolve all issues in the current query?')
                    : (count) =>
                        tn('Are you sure you want to resolve these %d issue?',
                           'Are you sure you want to resolve these %d issues?',
                           count)
                 }
                 confirmLabel={
                  this.state.allSelected
                    ? t('Resolve all issues')
                    : (count) =>
                        tn('Resolve %d selected issue',
                           'Resolve %d selected issues',
                           count)
                 }
                 tooltip={t('Set Status to Resolved')}
                 onlyIfBulk={true}
                 selectAllActive={this.state.pageSelected}>
                <i aria-hidden="true" className="icon-checkmark"></i>
              </ActionLink>
              <ActionLink
                 className="btn btn-default btn-sm action-bookmark"
                 disabled={!this.state.anySelected || this.state.allSelected}
                 onAction={this.onUpdate.bind(this, {isBookmarked: true})}
                 neverConfirm={true}
                 buttonTitle={t('Bookmark')}
                 confirmLabel={
                    (count) =>
                      tn('Bookmark %d selected issue',
                         'Bookmark %d selected issues',
                          count)
                 }
                 tooltip={t('Add to Bookmarks')}
                 onlyIfBulk={true}
                 selectAllActive={this.state.pageSelected}>
                <i aria-hidden="true" className="icon-bookmark"></i>
              </ActionLink>

              <DropdownLink
                key="actions"
                btnGroup={true}
                caret={false}
                className="btn btn-sm btn-default hidden-xs action-more"
                title={<span className="icon-ellipsis"></span>}>
                <MenuItem noAnchor={true}>
                  <ActionLink
                    className="action-merge"
                    disabled={!this.state.multiSelected || this.state.allSelected}
                    onAction={this.onMerge}
                    confirmationQuestion={
                      (count) =>
                        tn('Are you sure you want to merge %d issue?',
                           'Are you sure you want to merge %d issues?',
                           count)
                    }
                    confirmLabel={
                      (count) =>
                        tn('Merge %d selected issue',
                           'Merge %d selected issues',
                           count)
                    }
                    selectAllActive={this.state.pageSelected}>
                    {t('Merge Events')}
                  </ActionLink>
                </MenuItem>
                <MenuItem noAnchor={true}>
                  <ActionLink
                    className="action-remove-bookmark"
                    disabled={!this.state.anySelected}
                    onAction={this.onUpdate.bind(this, {isBookmarked: false})}
                    confirmationQuestion={
                      this.state.allSelected
                        ? t('Are you sure you want to remove all issues in the current query from your bookmarks?')
                        : (count) =>
                            tn('Are you sure you want to remove this %d issue from your bookmarks?',
                               'Are you sure you want to remove these %d issues from your bookmarks?',
                               count)
                    }
                    confirmLabel={
                      this.state.allSelected
                        ? t('Remove all issues from bookmarks')
                        : (count) =>
                            tn('Remove %d selected issue from bookmarks',
                               'Remove %d selected issues from bookmarks',
                               count)
                    }
                    onlyIfBulk={true}
                    selectAllActive={this.state.pageSelected}>
                   {t('Remove from Bookmarks')}
                  </ActionLink>
                </MenuItem>
                <MenuItem divider={true} />
                <MenuItem noAnchor={true}>
                  <ActionLink
                    className="action-unresolve"
                    disabled={!this.state.anySelected}
                    onAction={this.onUpdate.bind(this, {status: 'unresolved'})}
                    confirmationQuestion={
                      this.state.allSelected
                        ? t('Are you sure you want to unresolve all issues in the current query?')
                        : (count) =>
                          tn('Are you sure you want to unresolve these %d issue?',
                             'Are you sure you want to unresolve these %d issues?',
                             count)
                    }
                    confirmLabel={
                      this.state.allSelected
                        ? t('Unresolve all issues')
                        : (count) =>
                            tn('Unresolve %d selected issue',
                               'Unresolve %d selected issues',
                               count)
                    }
                    onlyIfBulk={true}
                    selectAllActive={this.state.pageSelected}
                    groupIds={this.props.groupIds}>
                   {t('Set status to: Unresolved')}
                  </ActionLink>
                </MenuItem>
                <MenuItem noAnchor={true}>
                  <ActionLink
                    className="action-mute"
                    disabled={!this.state.anySelected}
                    onAction={this.onUpdate.bind(this, {status: 'muted'})}
                    confirmationQuestion={
                      this.state.allSelected
                        ? t('Are you sure you want to mute all issues in the current query?')
                        : (count) =>
                             tn('Are you sure you want to mute these %d issue?',
                                'Are you sure you want to mute these %d issues?',
                                count)
                    }
                    confirmLabel={
                      this.state.allSelected
                        ? t('Mute all issues')
                        : (count) =>
                            tn('Mute %d selected issue',
                               'Mute %d selected issues',
                               count)
                    }
                    onlyIfBulk={true}
                    selectAllActive={this.state.pageSelected}>
                   {t('Set status to: Muted')}
                  </ActionLink>
                </MenuItem>
                <MenuItem divider={true} />
                <MenuItem noAnchor={true}>
                  <ActionLink
                    className="action-delete"
                    disabled={!this.state.anySelected || this.state.allSelected}
                    onAction={this.onDelete}
                    confirmationQuestion={
                      (count) =>
                        tn('Are you sure you want to delete %d issue?',
                           'Are you sure you want to delete %d issues?',
                           count)
                    }
                    confirmLabel={
                      (count) =>
                        tn('Delete %d selected issue',
                           'Delete %d selected issues',
                           count)
                    }
                    selectAllActive={this.state.pageSelected}>
                   {t('Delete Events')}
                  </ActionLink>
                </MenuItem>
              </DropdownLink>
            </div>

            <div className="btn-group">
              <a className="btn btn-default btn-sm hidden-xs realtime-control"
                 onClick={this.onRealtimeChange}>
                {(this.props.realtimeActive ?
                  <span className="icon icon-pause"></span>
                  :
                  <span className="icon icon-play"></span>
                )}
              </a>
            </div>
          </div>
          <div className="hidden-sm stream-actions-assignee col-md-1"></div>
          <div className="stream-actions-level col-md-1 hidden-xs"></div>
          <div className="hidden-sm hidden-xs stream-actions-graph col-md-2">
            <span className="stream-actions-graph-label">{t('Graph:')}</span>
            <ul className="toggle-graph">
              <li className={this.props.statsPeriod === '24h' ? 'active' : ''}>
                <a onClick={this.selectStatsPeriod.bind(this, '24h')}>{t('24h')}</a>
              </li>
              <li className={this.props.statsPeriod === '14d' ? 'active' : ''}>
                <a onClick={this.selectStatsPeriod.bind(this, '14d')}>{t('14d')}</a>
              </li>
            </ul>
          </div>
          <div className="stream-actions-count align-right col-md-1 col-sm-2 col-xs-2">{t('Events')}</div>
          <div className="stream-actions-users align-right col-md-1 col-sm-2 col-xs-2">{t('Users')}</div>
        </div>
        {this.state.pageSelected &&
          <div className="row stream-select-all-notice" >
            <div className="col-md-12">
              {this.state.allSelected
                ? <span>{t('All %d records in current query selected.', 500)}</span>
                : <span>
                    {tn('%d record on this page selected.',
                      '%d records on this page selected.', 25)}
                    <a onClick={this.selectAll}>
                      {t('Select all %d records in current query.', 500)}
                    </a>
                  </span>
              }
            </div>
          </div>
        }
      </div>
    );
  }
});

export default StreamActions;
