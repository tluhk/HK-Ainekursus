// markdown
const tinyMDE1 = new TinyMDE.Editor({ textarea: 'component' }).addEventListener(
  'change', debounce((eventData, xxx) => {
    handleMDChange(eventData.content, 'component');
  }, 500));
const commandBar1 = new TinyMDE.CommandBar(
  { element: 'tinymde_commandbar', editor: tinyMDE1 });
const tinyMDE2 = new TinyMDE.Editor(
  { textarea: 'additionalMaterials[content]' }).addEventListener(
  'change', debounce((eventData, xxx) => {
    handleMDChange(eventData.content, 'additionalMaterials[content]');
  }, 500));
const commandBar2 = new TinyMDE.CommandBar(
  { element: 'tinymde_commandbar2', editor: tinyMDE2 });

const lessons = document.querySelectorAll('.lesson');

lessons.forEach((title, index) => {
  title.addEventListener('click', () => {
    const content = title.nextElementSibling;
    content.classList.toggle('hidden');
  });
  const tinyMDE = new TinyMDE.Editor(
    { textarea: 'lessons_content_' + index }).addEventListener(
    'change', debounce((eventData, xxx) => {
      handleMDChange(eventData.content, 'lessons_content_' + index);
    }, 500));
  const cm = new TinyMDE.CommandBar({
    element: 'tinymde_commandbar_lessons_content_' + index, editor: tinyMDE
  });

  const tinyMDE2 = new TinyMDE.Editor(
    { textarea: 'lessons_add_' + index }).addEventListener(
    'change', debounce((eventData, xxx) => {
      handleMDChange(eventData.content, 'lessons_add_' + index);
    }, 500));
  const cm2 = new TinyMDE.CommandBar(
    { element: 'tinymde_commandbar_lessons_add_' + index, editor: tinyMDE2 });
});
