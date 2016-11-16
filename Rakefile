require "./task/i18n"
require "./task/po_file"
require "rake"

# some constants
SRC_DIR      = "./source"

SRC_FILES    = "**/*.html"
SRC_PO       = "./source/locales"
EN_PO_FILE   = "en.po"

LAYOUT_NAME  = "default"
LAYOUTS_DIR  = "_layouts"
INCLUDES_DIR = "_includes"
STATICS_DIR  = "static"

CROWDIN_PROJECT_ID = "champion-static"
CROWDIN_API_KEY = "cc6cdd12a17ff0e20d28c65fbdd8aff6"

i18n_task = nil

#create task and populate it with data
ChampionFX::Task::I18n.define do |t|
  t.src_dir     = SRC_DIR
  t.src_files   = SRC_FILES

  t.src_po_dir  = SRC_PO
  t.en_po_file  = EN_PO_FILE

  t.layout_name  = LAYOUT_NAME
  t.layouts_dir  = LAYOUTS_DIR
  t.includes_dir = INCLUDES_DIR
  t.statics_dir  = STATICS_DIR

  t.crowdin_id  = CROWDIN_PROJECT_ID
  t.crowdin_key = CROWDIN_API_KEY

  t.po_file = ChampionFX::PoFile
  i18n_task = t
end

task :default => [:build]

task :build do
  i18n_task.build_html
end

task :translate do
  i18n_task.create_en_po
end