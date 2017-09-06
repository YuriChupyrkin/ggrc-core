# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Mapping rules for Relationship validation and map:model import columns."""

import collections
import functools


class ImmutableDict(collections.Mapping):
  """An immutable wrapper for defaultdict with False by default."""

  __slots__ = ("_dict", "_hash")
  DEFAULT_VALUE = False

  def __init__(self, **kwargs):
    self._dict = collections.defaultdict(lambda: self.DEFAULT_VALUE)
    self._hash = None
    self._update(**kwargs)

  def _update(self, *args, **kwargs):
    """Update internal dict."""
    self._dict.update(*args, **kwargs)

  def __getitem__(self, key):
    """Passthrough to internal dict."""
    return self._dict[key]

  def __iter__(self):
    """Passthrough to internal dict."""
    return self._dict.__iter__()

  def __len__(self):
    """Passthrough to internal dict."""
    return self._dict.__len__()

  def __hash__(self):
    """Hash of own values (computed lazily)."""
    if self._hash is None:
      self._hash = hash(frozenset(self._dict.iteritems()))
    return self._hash

  def __eq__(self, other):
    """True if other is instance of self.__class__ and has same _dict."""
    return isinstance(other, self.__class__) and self._dict == other._dict

  def __repr__(self):
    return "{cls}(**{arg})".format(cls=self.__class__.__name__,
                                   arg=dict(self._dict))


class Labels(object):
  """Enum with labels used as MappingRule keys."""
  MAP = "map"
  UNMAP = "unmap"
  TYPE = "type"
  MAP_SNAPSHOT = "map_snapshot"
  UNMAP_SNAPSHOT = "unmap_snapshot"


class BasicRule(ImmutableDict):
  """Passes cls.VALUE to ImmutableDict."""

  VALUE = {}

  def __init__(self, type_):
    value = {Labels.TYPE: type_}
    value.update(self.VALUE)
    super(BasicRule, self).__init__(**value)


class MappingRule(BasicRule):
  """Boolean flags for mappings."""

  VALUE = {Labels.MAP: True,
           Labels.UNMAP: True}


class StaticMappingRule(BasicRule):
  """Boolean flags to only show mapped objects."""

  VALUE = {Labels.MAP: True}


class SnapshotMappingRule(MappingRule):
  """Boolean flags to map/unmap snapshots."""

  VALUE = {Labels.MAP_SNAPSHOT: True,
           Labels.UNMAP_SNAPSHOT: True}


class StaticSnapshotMappingRule(MappingRule):
  """Boolean flags to only show mapped snapshots."""

  VALUE = {Labels.MAP_SNAPSHOT: True}


class IssueMappingRule(MappingRule):
  """Boolean flags to allow to map/unmap original objects and snapshots."""

  VALUE = {Labels.MAP: True,
           Labels.UNMAP: True,
           Labels.MAP_SNAPSHOT: True,
           Labels.UNMAP_SNAPSHOT: True}


def wrap_rules(func):
  """Transform str-type rules into MappingRule(str)."""
  def make_rules(items):
    """For all non-BasicRule items, replace them with MappingRule(item)."""
    for item in items:
      if not isinstance(item, BasicRule):
        item = MappingRule(type_=item)
      yield item

  @functools.wraps(func)
  def inner(*args, **kwargs):
    """Transform func result {key: {rule}} -> {key: {rule.type: rule}}."""
    result = func(*args, **kwargs)
    return {key: set(make_rules(value))
            for (key, value) in result.iteritems()}

  return inner


class ClassProperty(property):
  """Readonly property to use on class."""
  def __get__(self, cls, owner):
    return self.fget.__get__(None, owner)()


class CachedClassProperty(ClassProperty):
  """Cached readonly property to use on class."""
  def __init__(self, *args, **kwargs):
    super(CachedClassProperty, self).__init__(*args, **kwargs)
    self._result = None
    self._has_result = False

  def __get__(self, cls, owner):
    if not self._has_result:
      self._result = super(CachedClassProperty, self).__get__(cls, owner)
      self._has_result = True
    return self._result


class MappingRules(object):
  """Container for mapping rules collection."""

  @CachedClassProperty
  @classmethod
  @wrap_rules
  def all_rules(cls):
    """Get mapping, unmapping and snapshot mapping rules.

    Special cases:
      Audit has direct mapping to Program with program_id
      Assessment has direct mapping to Audit as well as Relationship
    """
    from ggrc import snapshotter

    all_rules = {'AccessGroup', 'Clause', 'Contract', 'Control',
                 'CycleTaskGroupObjectTask', 'DataAsset', 'Facility',
                 'Market', 'Objective', 'OrgGroup', 'Person',
                 'Policy', 'Process', 'Product', 'Program', 'Project',
                 'Regulation', 'Risk', 'Section', 'Standard',
                 'System', 'Threat', 'Vendor'}

    snapshots = snapshotter.rules.Types.all

    all_rules = {
        "AccessGroup": all_rules - set(['AccessGroup']),
        "Clause": all_rules - set(['Clause']),
        "Contract": all_rules - set(['Policy', 'Regulation',
                                     'Contract', 'Standard']),
        "Control": all_rules,
        "CycleTaskGroupObjectTask": (all_rules -
                                     set(['CycleTaskGroupObjectTask'])),
        "DataAsset": all_rules,
        "Facility": all_rules,
        "Market": all_rules,
        "Objective": all_rules,
        "OrgGroup": all_rules,
        "Person": all_rules - set(['Person']),
        "Policy": all_rules - set(['Policy', 'Regulation',
                                   'Contract', 'Standard']),
        "Process": all_rules,
        "Product": all_rules,
        "Program": all_rules - set(['Program']),
        "Project": all_rules,
        "Regulation": all_rules - set(['Policy', 'Regulation',
                                       'Contract', 'Standard']),
        "Risk": all_rules - set(['Risk']),
        "Section": all_rules,
        "Standard": all_rules - set(['Policy', 'Regulation',
                                     'Contract', 'Standard']),
        "System": all_rules,
        "Threat": all_rules - set(['Threat']),
        "Vendor": all_rules,
    }

    # Audit and Audit-scope objects
    # Assessment has a special Audit field instead of map:audit

    all_rules.update({
        "Audit": {StaticMappingRule("Assessment"), "Issue"} | {
            StaticSnapshotMappingRule(type_) for type_ in snapshots
        },
        "Assessment": {"Issue"} | {
            StaticSnapshotMappingRule(type_) for type_ in snapshots
        },
        "Issue": {"Assessment", "Audit"} | {
            IssueMappingRule(type_) for type_ in snapshots
        },
    })

    return all_rules

  @classmethod
  def _filter_rules(cls, flag):
    """Get rule.type_ for each rule[flag] == True."""
    return {key: {rule[Labels.TYPE] for rule in value if rule[flag]}
            for (key, value) in cls.all_rules.iteritems()}

  @CachedClassProperty
  @classmethod
  def map_rules(cls):
    """Allowed map: columns for types."""
    return cls._filter_rules(Labels.MAP)

  @CachedClassProperty
  @classmethod
  def unmap_rules(cls):
    """Allowed unmap: columns for types."""
    return cls._filter_rules(Labels.UNMAP)

  @CachedClassProperty
  @classmethod
  def map_snapshot_rules(cls):
    """Allowed snapshot_map: columns for types."""
    return cls._filter_rules(Labels.MAP_SNAPSHOT)

  @CachedClassProperty
  @classmethod
  def unmap_snapshot_rules(cls):
    """Allowed snapshot_unmap: columns for types."""
    return cls._filter_rules(Labels.UNMAP_SNAPSHOT)


__all__ = [
    "MappingRules",
]
