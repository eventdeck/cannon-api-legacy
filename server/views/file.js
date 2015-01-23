module.exports = function render(content) {
  if(content instanceof Array) {
    return content.map(renderObject);
  }

  return renderObject(content);  
};

function renderObject(model) {
  return {
    id: model.id,
    name: model.name,
		kind: model.kind,
    extension: model.extension,
		created: model.created,
		updated: model.updated
  };
}