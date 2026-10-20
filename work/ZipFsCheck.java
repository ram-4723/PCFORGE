import java.nio.file.*;
import java.util.*;
public class ZipFsCheck { public static void main(String[] a) throws Exception { Path p=Path.of(a[0]); System.out.println("exists="+Files.exists(p)); System.out.println("readable="+Files.isReadable(p)); System.out.println("absolute="+p.toAbsolutePath()); System.out.println("real="+p.toRealPath()); } }
