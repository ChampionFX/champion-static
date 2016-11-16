require 'pathname'
require 'fileutils'

require 'json'
require 'crowdin-api'
require 'zip'

require 'rake'

PATTERN = /\[%\s*(.*?)\s*%\]/

module ChampionFX
  module Task

    class I18n
      class << self
        def define
          task = new
          yield(task) if block_given?
          task.define
        end
      end

      attr_accessor :src_dir

      attr_accessor :src_files
      attr_accessor :src_po_dir
      attr_accessor :en_po_file

      attr_accessor :layout_name
      attr_accessor :statics_dir
      attr_accessor :layouts_dir
      attr_accessor :includes_dir

      attr_accessor :crowdin_id
      attr_accessor :crowdin_key

      attr_accessor :po_file

      def initialize
        puts "Init\n"
      end


      def define
        @crowdin = Crowdin::API.new(api_key: @crowdin_key, project_id: @crowdin_id)
      end


      def create_en_po
        src_files = Rake::FileList.new("#{@src_dir}/#{@src_files}")
        path = Pathname("#{@src_po_dir}/#{@en_po_file}")
        path.write('')
        en_po = @po_file.new path
        print 'Parsing .html files....'
        src_files.each { |filename|
          File.foreach(filename) do |line|
            line.scan PATTERN do |matches|
              en_po.add_entry(matches[0]) if matches.length
            end
          end
        }
        puts 'done'

        en_po.sort
        en_po.write
        self.upload_en_po en_po.path
      end


      def upload_en_po file
        print "Uploading #{file}...."
        response = @crowdin.update_file(
            files = [
                { :dest => @en_po_file, :source => file, :title => '', :export_pattern => '%two_letters_code%.po' }
            ]
        )
        if response['success']
          puts 'success'
        else
          puts "error! => #{response}"
        end
      end


      def build_html
        self.get_translations

        # first, parse en.po
        en_po_file = Pathname.new("#{@src_po_dir}/#{@en_po_file}")
        en_po = PoFile.new en_po_file

        self.create_dst_html en_po

        # then, all other .po files
        po_files = Rake::FileList["#{@src_po_dir}/**/*.po"]
        po_files.exclude /en\.po$/ #except en.po
        po_files.each { |filename|
          po_file = Pathname.new(filename)
          po_parsed = PoFile.new po_file
          self.create_dst_html po_parsed, en_po
        }

      end


      def get_translations
        print "Downloading translations...."
        response = @crowdin.download_translation('all', :output => "#{@src_po_dir}/all.zip")
        puts "done"
        if response
          print "Extracting...."
          Zip::File.open("#{@src_po_dir}/all.zip") do |zip_file|
            zip_file.each do |entry|
              file_path = "#{@src_po_dir}/#{entry.name}"
              #check if dest file exists and delete it
              File.unlink file_path if File.file? file_path
              entry.extract(file_path)
            end
          end
          File.unlink "#{@src_po_dir}/all.zip"
          puts "done"
        else
          puts "Error downloading... #{response}"
        end
      end

      def create_dst_html dst_po, en_po = nil
        src_files = Rake::FileList.new("#{@src_dir}/#{@src_files}")

        src_files.each {|filename|
          dst_string = ''
          is_static = is_layout = front_matter_parsed = nil

          pathname = Pathname.new filename


          dst_dirname  = "#{pathname.dirname.sub(@src_dir, '')}"
          dst_filename = "#{pathname.basename}"
          if dst_dirname.match /#{@statics_dir}/
            is_static = true
            dst_dirname.sub! "/#{@statics_dir}", "#{@statics_dir}/#{dst_po.lang}/"
          elsif dst_dirname.match /#{@layouts_dir}/
            is_layout = true
            dst_dirname.sub! "/#{@layouts_dir}", "#{@layouts_dir}/#{dst_po.lang}/"
          elsif dst_dirname.match /#{@includes_dir}/
            dst_dirname.sub! "/#{@includes_dir}", "#{@includes_dir}/#{dst_po.lang}/"
          end

          File.foreach(filename) do |line|
            if line.match(/---/) && !front_matter_parsed
              if is_static
                line << "layout: #{dst_po.lang}/#{@layout_name}\n"
                line << "permalink: #{dst_dirname.sub(@statics_dir+'/', '')}/#{dst_filename.sub(/\.[a-z]+$/, '')}\n"
              elsif is_layout
                line << "lang: #{dst_po.lang}\n"
              end
              front_matter_parsed = true
            else
              while matches = line.match(PATTERN) do
                translation = dst_po.find matches[1]
                translation = en_po.find matches[1] if !translation && en_po
                line.sub! matches[0], translation
              end
            end
            dst_string << line
          end

          dst_dirname << '/' unless dst_dirname[-1] == '/'
          dst_file = Pathname.new dst_dirname+dst_filename
          dst_file.dirname.mkpath()
          dst_file.write dst_string
        }
      end


    end #end of I18n




  end
end

