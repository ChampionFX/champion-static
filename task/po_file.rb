module ChampionFX

  class PoFile

    #enumerable
    include Enumerable

    def each (&block)
      @entries.each {|entry| block.call(entry)}
    end

    def include? msgid
      @entries.index {|entry| entry.msgid == msgid} != nil
    end

    def sort
      @entries.sort! {|x,y| x.msgid <=> y.msgid}
    end

    def find msgid
      result = nil
      entry = @entries.find {|entry|
        entry.msgid == msgid
      }
      if entry
        result = entry.msgstr.length > 0 ? entry.msgstr : entry.msgid
      end
      result
    end
    #end of enumerable

    attr_accessor :path
    attr_accessor :lang

    def initialize path
      @entries = []
      self.read_path path
    end


    def add_entry msgid, msgstr = ''
      @entries << PoEntry.new(msgid, msgstr) unless self.include? msgid
    end


    def read_path path
      raise "Error reading .po file" unless path && path.file? && path.readable? && path.writable?
      @path = path
      @lang = @path.basename.sub(/\.[a-z]+$/, '').to_s().downcase

      # check if language contains 2 different parts
      splitted = @lang.split('_')
      @lang = splitted[0] if splitted.length == 2 && splitted[0] == splitted[1]

      msgid  = nil
      msgstr = nil
      File.foreach(@path) do |line|
        if !line.match /^$/
          if !msgid && matches = line.match(/^msgid "(.*)"$/)
            msgid = matches[1].gsub('\"', '"')
          elsif msgid && !msgstr && matches = line.match(/^msgstr "(.*)"$/)
            msgstr = matches[1].gsub('\"', '"')
            @entries << PoEntry.new(msgid, msgstr)
          else
            puts 'malformed .po file'
          end
        else
          msgid = nil
          msgstr = nil
        end
      end
    end


    def get_translated msgid

    end


    def write
      string = ''
      self.each {|entry| string << "msgid \"#{entry.msgid.gsub('"', '\"')}\"\nmsgstr \"#{entry.msgstr.gsub('"', '\"')}\"\n\n"}
      @path.write string
    end

  end #end of PoFile


  class PoEntry

    attr_accessor :msgid
    attr_accessor :msgstr

    def initialize msgid, msgstr
      @msgid = msgid
      @msgstr = msgstr
    end

  end #end of PoEntry

end