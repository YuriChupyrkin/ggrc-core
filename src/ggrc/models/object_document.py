# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" Module for docuumentable mixins."""

import collections

from sqlalchemy import orm, case, and_, literal
from sqlalchemy.ext.declarative import declared_attr

from ggrc import db
from ggrc.models import reflection
from ggrc.models.relationship import Relationship
from ggrc.models.document import Document
from ggrc.utils import create_stub
from ggrc.fulltext.attributes import MultipleSubpropertyFullTextAttr


class Documentable(object):
  """Documentable mixin."""

  _include_links = []

  _fulltext_attrs = [
      MultipleSubpropertyFullTextAttr('document_evidence', 'document_evidence',
                                      ['title', 'link']),
      MultipleSubpropertyFullTextAttr('document_url', 'document_url',
                                      ['link']),
  ]

  @classmethod
  def documents(cls, document_type):
    """Return documents releated for that instance and sent docuemtn type."""
    document_id = case(
        [
            (
                Relationship.destination_type == "Document",
                Relationship.destination_id,
            ),
            (
                Relationship.source_type == "Document",
                Relationship.source_id,
            ),
        ],
        else_=literal(False)
    )
    documentable_id = case(
        [
            (
                Relationship.destination_type == "Document",
                Relationship.source_id
            ),
            (
                Relationship.source_type == "Document",
                Relationship.destination_id,
            ),
        ],
        else_=literal(False)
    )
    return db.relationship(
        Document,
        # at first we check is documentable_id not False (it return id in fact)
        # after that we can compare values.
        # this is required for saving logic consistancy
        # case return 2 types of values BOOL(false) and INT(id) not Null
        primaryjoin=lambda: and_(documentable_id, cls.id == documentable_id),
        secondary=Relationship.__table__,
        # at first we check is document_id not False (it return id in fact)
        # after that we can compare values.
        # this is required for saving logic consistancy
        # case return 2 types of values BOOL(false) and INT(id) not Null
        secondaryjoin=lambda: and_(document_id,
                                   Document.id == document_id,
                                   Document.document_type == document_type),
        viewonly=True,
    )

  @declared_attr
  def document_url(cls):  # pylint: disable=no-self-argument
    return cls.documents(Document.URL)

  @declared_attr
  def document_evidence(cls):  # pylint: disable=no-self-argument
    return cls.documents(Document.ATTACHMENT)

  @classmethod
  def eager_query(cls):
    """Eager query classmethod."""
    query = super(Documentable, cls).eager_query()
    document_fields = ["id", "title", "link", "description", "document_type"]
    return cls.eager_inclusions(query, Documentable._include_links).options(
        orm.subqueryload('document_url').load_only(*document_fields),
        orm.subqueryload('document_evidence').load_only(*document_fields),
    )

  @staticmethod
  def _log_docs(documents):
    return [d.log_json() for d in documents if d]

  def log_json(self):
    """Serialize to JSON"""
    # This query is required to refresh related documents collection after
    # they were mapped to an object. Otherwise python uses cached value,
    # which might not contain newly created documents.
    subquery = db.session.query(
        Relationship.destination_id.label("document_id")
    ).filter(
        Relationship.source_id == self.id,
        Relationship.source_type == self.type,
        Relationship.destination_type == "Document",
    ).union(
        db.session.query(
            Relationship.source_id.label("document_id")
        ).filter(
            Relationship.destination_id == self.id,
            Relationship.destination_type == self.type,
            Relationship.source_type == "Document",
        )
    ).subquery("document_ids")
    query = Document.eager_query().filter(
        Document.id == subquery.c.document_id)

    document_dict = collections.defaultdict(list)
    for document in query:
      document_dict[document.document_type].append(document)
    out_json = super(Documentable, self).log_json()
    out_json["document_url"] = self._log_docs(document_dict[Document.URL])
    out_json["document_evidence"] = self._log_docs(
        document_dict[Document.ATTACHMENT])
    return out_json

  @classmethod
  def indexed_query(cls):
    return super(Documentable, cls).indexed_query().options(
        orm.subqueryload("document_url").load_only("id", "title", "link"),
        orm.subqueryload("document_evidence").load_only("id", "link"),
    )


PublicDocumentable = type(
    "PublicDocumentable",
    (Documentable, ),
    {
        "_aliases": {
            "document_url": {
                "display_name": "Url",
                "type": reflection.AttributeInfo.Type.SPECIAL_MAPPING,
                "description": "New line separated list of URLs.",
            },
            "document_evidence": {
                "display_name": "Evidence",
                "type": reflection.AttributeInfo.Type.SPECIAL_MAPPING,
                "description": (
                    "New line separated list of evidence links and "
                    "titles.\nExample:\n\nhttp://my.gdrive.link/file "
                    "Title of the evidence link"
                ),
            },
        }
    })
